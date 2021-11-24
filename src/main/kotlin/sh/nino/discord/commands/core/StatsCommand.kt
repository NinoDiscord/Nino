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

import dev.kord.common.entity.Snowflake
import dev.kord.core.Kord
import kotlinx.coroutines.flow.count
import org.apache.commons.lang3.time.StopWatch
import org.jetbrains.exposed.sql.transactions.transaction
import org.redisson.api.RedissonClient
import org.redisson.api.redisnode.RedisNodes
import sh.nino.discord.NinoInfo
import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandMessage
import sh.nino.discord.data.Config
import sh.nino.discord.extensions.formatSize
import sh.nino.discord.extensions.humanize
import sh.nino.discord.extensions.reduce
import java.lang.management.ManagementFactory
import java.util.concurrent.TimeUnit
import kotlin.math.floor
import kotlin.time.Duration

private data class DatabaseStats(
    val version: String,
    val uptime: Long,
    val ping: Long
)

@Command(
    name = "stats",
    description = "descriptions.core.stats",
    aliases = ["me", "info", "botinfo", "statistics", "nerd"]
)
class StatsCommand(
    private val kord: Kord,
    private val config: Config,
    private val redis: RedissonClient
): AbstractCommand() {
    override suspend fun run(msg: CommandMessage) {
        val guilds = kord.guilds.count()
        val users = kord.guilds.reduce(0) { acc, guild ->
            val count = guild.memberCount ?: 0
            acc + count
        }

        val channels = kord.guilds.reduce(0) { acc, guild ->
            val channels = guild.channels.count()
            acc + channels
        }

        val dbStats = getDatabaseStats()
        val processHandle = ProcessHandle.current()
        val actualRuntime = Runtime.getRuntime()
        val os = ManagementFactory.getOperatingSystemMXBean()
        val memory = ManagementFactory.getMemoryMXBean()
        val dediNode = System.getProperty("winterfox.dedi", "none")
        val avgLatency = kord.gateway.averagePing?.inWholeMilliseconds ?: Duration.ZERO.inWholeMilliseconds
        val redisInfo = getRedisInfo()

        val metricsUrl = if (kord.selfId == Snowflake(531613242473054229L))
            "https://stats.floofy.dev/d/e3KPDLknk/nino-prod?orgId=1"
        else if (kord.selfId == Snowflake(613907896622907425L))
            "https://stats.floofy.dev/d/C5bZHVZ7z/nino-edge?orgId=1"
        else null

        msg.replyEmbed {
            title = ":satellite: Statistics${if (dediNode == "none") "" else " under $dediNode"}"
            if (metricsUrl != null)
                description = metricsUrl

            field {
                name = "Miscellaneous"
                value = buildString {
                    appendLine("• **Guilds**: $guilds")
                    appendLine("• **Users**: $users")
                    appendLine("• **Channels**: $channels")
                    appendLine("• **Shards**: ${kord.gateway.gateways.size} (avg: ${avgLatency}ms)")
                }

                inline = true
            }

            field {
                name = "Process [${processHandle.pid()}]"
                value = buildString {
                    appendLine("• **System Memory [Free / Total]**: ${actualRuntime.freeMemory().formatSize()} / ${actualRuntime.totalMemory().formatSize()}")
                    appendLine("• **Processors**: ${actualRuntime.availableProcessors()}")
                    appendLine("• **Operating System**: ${os.name} (${os.arch})")
                    appendLine("• **Heap Memory Usage**: ${memory.heapMemoryUsage.used.formatSize()}")
                    appendLine("• **CPU Load**: ${os.systemLoadAverage}%")
                    appendLine("• **Uptime**: ${ManagementFactory.getRuntimeMXBean().uptime.humanize()}")
                }

                inline = true
            }

            field {
                name = "Versions"
                value = buildString {
                    appendLine("• **Java**: v${System.getProperty("java.version")} (${System.getProperty("java.vendor")})")
                    appendLine("• **Kotlin**: v${KotlinVersion.CURRENT}")
                    appendLine("• **Nino**: v${NinoInfo.VERSION} (commit: ${NinoInfo.COMMIT_HASH}; build date: ${NinoInfo.BUILD_DATE})")
                    appendLine("• **Kord**: v0.8.0-M7")
                }

                inline = true
            }

            field {
                name = "PostgreSQL"
                value = buildString {
                    appendLine("• **Version**: v${dbStats.version.replace("PostgreSQL", "")}")
                    appendLine("• **Uptime**: ${dbStats.uptime.humanize()}")
                }
            }

            field {
                name = "Redis"
                value = buildString {
                    appendLine("• **Ping**: ${redisInfo}ms")
                }

                inline = true
            }

            footer {
                text = "Environment: ${config.environment}"
            }
        }
    }

    private fun getDatabaseStats(): DatabaseStats {
        // get db ping
        val watch = StopWatch()
        watch.start()
        transaction {
            exec("SELECT * FROM guilds;") {
                it.next()
            }
        }

        watch.stop()

        // Get external stats from PostgreSQL
        val version = transaction {
            exec("SELECT VERSION();") {
                it.next()

                val value = it.getString("version")!!
                it.close(); value
            }
        }

        val uptime = transaction {
            exec("SELECT extract(epoch FROM current_timestamp - pg_postmaster_start_time()) AS uptime;") {
                it.next()

                val value = it.getDouble("uptime")
                it.close(); value
            }
        }

        return DatabaseStats(
            version!!,
            uptime = floor(uptime!! * 1000).toLong(),
            ping = watch.getTime(TimeUnit.MILLISECONDS)
        )
    }

    private fun getRedisInfo(): Long {
        val watch = StopWatch()
        val nodes = redis.getRedisNodes(
            if (config.redis.sentinels.isNotEmpty())
                RedisNodes.SENTINEL_MASTER_SLAVE
            else
                RedisNodes.SINGLE
        )

        watch.start()
        nodes.pingAll()

        watch.stop()
        return watch.getTime(TimeUnit.MILLISECONDS)
    }
}
