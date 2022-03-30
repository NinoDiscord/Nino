/*
 * Copyright (c) 2019-2022 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package sh.nino.discord.core.redis

import gay.floof.utils.slf4j.logging
import io.lettuce.core.RedisClient
import io.lettuce.core.RedisURI
import io.lettuce.core.api.StatefulRedisConnection
import io.lettuce.core.api.async.RedisAsyncCommands
import kotlinx.coroutines.future.await
import org.apache.commons.lang3.time.StopWatch
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.extensions.asMap
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.toDuration

data class RedisStats(
    val serverStats: Map<String, String>,
    val stats: Map<String, String>,
    val ping: Duration
)

class RedisManager(config: Config): AutoCloseable {
    private lateinit var connection: StatefulRedisConnection<String, String>
    lateinit var commands: RedisAsyncCommands<String, String>
    private val logger by logging<RedisManager>()
    val client: RedisClient

    init {
        logger.info("Creating Redis client...")

        val redisUri: RedisURI = if (config.redis.sentinels.isNotEmpty()) {
            val builder = RedisURI.builder()
            val sentinelRedisUri = RedisURI.builder()
                .withSentinelMasterId(config.redis.master!!)
                .withDatabase(config.redis.index)

            for (host in config.redis.sentinels) {
                val (h, port) = host.split(":")
                sentinelRedisUri.withSentinel(h, Integer.parseInt(port))
            }

            if (config.redis.password != null)
                sentinelRedisUri.withPassword(config.redis.password!!.toCharArray())

            builder
                .withSentinel(sentinelRedisUri.build())
                .build()
        } else {
            val builder = RedisURI
                .builder()
                .withHost(config.redis.host)
                .withPort(config.redis.port)
                .withDatabase(config.redis.index)

            if (config.redis.password != null)
                builder.withPassword(config.redis.password!!.toCharArray())

            builder.build()
        }

        client = RedisClient.create(redisUri)
    }

    override fun close() {
        // If the connection was never established, skip.
        if (!::connection.isInitialized) return

        logger.warn("Closing Redis connection...")
        connection.close()
        client.shutdown()
    }

    fun connect() {
        // If it was already established, let's not skip.
        if (::connection.isInitialized) return

        logger.info("Creating connection...")
        connection = client.connect()
        commands = connection.async()

        logger.info("Connected!")
    }

    suspend fun getPing(): Duration {
        // If the connection wasn't established,
        // let's return Duration.ZERO
        if (::connection.isInitialized) return Duration.ZERO

        val watch = StopWatch.createStarted()
        commands.ping().await()
        watch.stop()

        return watch.time.toDuration(DurationUnit.MILLISECONDS)
    }

    suspend fun getStats(): RedisStats {
        val ping = getPing()

        // get stats from connection
        val serverStats = commands.info("server").await()
        val stats = commands.info("stats").await()

        val mappedServerStats = serverStats!!
            .split("\r\n?".toRegex())
            .drop(1)
            .dropLast(1)
            .map {
                val (key, value) = it.split(":")
                key to value
            }.asMap()

        val mappedStats = stats!!
            .split("\r\n?".toRegex())
            .drop(1)
            .dropLast(1)
            .map {
                val (key, value) = it.split(":")
                key to value
            }.asMap()

        return RedisStats(
            mappedServerStats,
            mappedStats,
            ping
        )
    }
}
