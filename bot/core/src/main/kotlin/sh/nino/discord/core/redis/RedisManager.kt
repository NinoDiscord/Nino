package sh.nino.discord.core.redis

import gay.floof.utils.slf4j.logging
import io.lettuce.core.RedisClient
import io.lettuce.core.RedisURI
import io.lettuce.core.api.StatefulRedisConnection
import io.lettuce.core.api.async.RedisAsyncCommands
import kotlinx.coroutines.future.await
import org.apache.commons.lang3.time.StopWatch
import sh.nino.discord.common.data.Config
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.toDuration

class RedisManager(config: Config): AutoCloseable {
    private lateinit var connection: StatefulRedisConnection<String, String>
    lateinit var commands: RedisAsyncCommands<String, String>
    private val client: RedisClient
    private val logger by logging<RedisManager>()

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
}
