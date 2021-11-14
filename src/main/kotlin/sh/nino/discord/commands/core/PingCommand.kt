/**
 * Copyright (c) 2019-2021 Nino
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

package sh.nino.discord.commands.core

import dev.kord.core.Kord
import org.apache.commons.lang3.time.StopWatch
import org.jetbrains.exposed.sql.transactions.transaction
import org.redisson.api.RedissonClient
import org.redisson.api.redisnode.RedisNodes
import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandMessage
import sh.nino.discord.data.Config
import java.util.concurrent.TimeUnit
import kotlin.time.Duration
import kotlin.time.ExperimentalTime

@Command(
    name = "ping",
    description = "descriptions.core.ping",
    aliases = ["pong", "lat", "latency"]
)
@OptIn(ExperimentalTime::class)
class PingCommand(
    private val kord: Kord,
    private val redis: RedissonClient,
    private val config: Config
): AbstractCommand() {
    override suspend fun run(msg: CommandMessage) {
        val message = msg.reply(":ping_pong: You're weird...")
        val stopwatch = StopWatch()

        stopwatch.start()
        message.delete()
        stopwatch.stop()

        val redis = redisPing()
        val pg = postgresPing()
        val node = System.getProperty("winterfox.dedi", "none")
        val gwPing = kord.gateway.averagePing ?: Duration.ZERO

        msg.reply(
            """
            📡 Running under node **$node**

            > **PostgreSQL (Database):** ${pg}ms
            > **Message**: ${stopwatch.getTime(TimeUnit.MILLISECONDS)}ms
            > **Gateway**: ${if (gwPing == Duration.ZERO) "???" else "${gwPing.inWholeMilliseconds}ms"}
            > **Redis** ${redis}ms
            """.trimIndent()
        )
    }

    private fun redisPing(): Long {
        val stopwatch = StopWatch()
        val nodes = redis.getRedisNodes(if (config.redis.sentinels.isNotEmpty()) RedisNodes.SENTINEL_MASTER_SLAVE else RedisNodes.SINGLE)
        stopwatch.start()
        nodes.pingAll()

        stopwatch.stop()
        return stopwatch.getTime(TimeUnit.MILLISECONDS)
    }

    private fun postgresPing(): Long {
        val stopwatch = StopWatch()
        stopwatch.start()
        transaction {
            exec("SELECT * FROM guilds;") {
                it.close()
            }
        }

        stopwatch.stop()
        return stopwatch.getTime(TimeUnit.MILLISECONDS)
    }
}
