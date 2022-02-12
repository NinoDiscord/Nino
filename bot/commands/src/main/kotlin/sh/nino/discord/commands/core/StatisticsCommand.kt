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

package sh.nino.discord.commands.core

import kotlinx.coroutines.flow.count
import org.apache.commons.lang3.time.StopWatch
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.common.DEDI_NODE
import sh.nino.discord.common.NinoInfo
import sh.nino.discord.common.extensions.formatSize
import sh.nino.discord.common.extensions.humanize
import sh.nino.discord.common.extensions.reduceWith
import sh.nino.discord.common.extensions.titleCase
import sh.nino.discord.core.redis.RedisManager
import sh.nino.discord.database.asyncTransaction
import java.lang.management.ManagementFactory
import java.util.concurrent.TimeUnit
import kotlin.math.floor
import kotlin.time.Duration.Companion.milliseconds

private data class DatabaseStats(
    val version: String,
    val fetched: Long,
    val updated: Long,
    val deleted: Long,
    val inserted: Long,
    val uptime: Long,
    val ping: Long
)

@Command(
    "statistics",
    "descriptions.core.statistics",
    aliases = ["stats", "botinfo", "me", "info"],
    cooldown = 8
)
class StatisticsCommand(private val redis: RedisManager): AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        val self = msg.kord.getSelf()
        val guilds = msg.kord.guilds.count()
        val processHandle = ProcessHandle.current()
        val runtime = Runtime.getRuntime()
        val os = ManagementFactory.getOperatingSystemMXBean()
        val memory = ManagementFactory.getMemoryMXBean()

        val users = msg.kord.guilds.reduceWith(0) { acc, curr ->
            val res = curr.memberCount ?: 0
            acc + res
        }

        val channels = msg.kord.guilds.reduceWith(0) { acc, guild ->
            val chan = guild.channels.count()
            acc + chan
        }

        val stats = getDbStats()
        val redis = redis.getStats()

        msg.reply(
            buildString {
                appendLine("```md")
                appendLine("# ${self.tag} - Statistics${if (DEDI_NODE != "none") " [$DEDI_NODE]" else ""}")
                appendLine("> This is a bunch of ~~useless~~ statistics you might care, I don't know!")
                appendLine()

                appendLine("## Bot")
                appendLine("* Channels: $channels")
                appendLine("* Guilds:   $guilds")
                appendLine("* Shards:   ${msg.kord.gateway.gateways.size} (~${msg.kord.gateway.averagePing?.inWholeMilliseconds ?: 0}ms)")
                appendLine("* Users:    $users")
                appendLine()

                appendLine("## Process [${processHandle.pid()}]")
                appendLine("* Memory Usage [Used / Total]: ${memory.heapMemoryUsage.used.formatSize()}")
                appendLine("* JVM Memory [Free / Total]:   ${runtime.freeMemory().formatSize()} / ${runtime.totalMemory().formatSize()}")
                appendLine("* CPU Processor Count:         ${runtime.availableProcessors()}")
                appendLine("* Operating System:            ${os.name} (${os.arch}; ${os.version})")
                appendLine("* CPU Load:                    ${os.systemLoadAverage}%")
                appendLine("* Uptime:                      ${ManagementFactory.getRuntimeMXBean().uptime.humanize(long = true, includeMs = false)}")
                appendLine()

                appendLine("## Versions")
                appendLine("* Kotlin: v${KotlinVersion.CURRENT}")
                appendLine("* Java:   v${System.getProperty("java.version")} (${System.getProperty("java.vendor")})")
                appendLine("* Nino:   v${NinoInfo.VERSION} (${NinoInfo.COMMIT_SHA} - ${NinoInfo.BUILD_DATE})")
                appendLine("* Kord:   v0.8.0-M9")
                appendLine()

                appendLine("## PostgreSQL [${stats.version}]")
                appendLine("* Uptime:  ${stats.uptime.humanize(true, includeMs = true)}")
                appendLine("* Ping:    ${stats.ping}ms")
                appendLine("* Query Stats:")
                appendLine("   * Fetched: ${stats.fetched} documents")
                appendLine("   * Updated: ${stats.updated} documents")
                appendLine("   * Deleted: ${stats.deleted} documents")
                appendLine("   * Inserted: ${stats.inserted} documents")
                appendLine()

                appendLine("# Redis [v${redis.serverStats["redis_version"]} - ${redis.serverStats["redis_mode"]!!.titleCase()})")
                appendLine("* Network Input/Output: ${redis.stats["total_net_input_bytes"]!!.toLong().formatSize()} / ${redis.stats["total_net_output_bytes"]!!.toLong().formatSize()}")
                appendLine("* Operations/s: ${redis.stats["instantaneous_ops_per_sec"]}")
                appendLine("* Uptime: ${(redis.serverStats["uptime_in_seconds"]!!.toLong() * 1000).humanize(false, includeMs = false)}")
                appendLine("* Ping: ${redis.ping.inWholeMilliseconds}ms")

                appendLine("```")
            }
        )
    }

    private suspend fun getDbStats(): DatabaseStats {
        // Get the ping of the database
        val sw = StopWatch.createStarted()
        asyncTransaction {
            exec("SELECT 1;") {
                it.close()
            }
        }

        sw.stop()

        val version = asyncTransaction {
            exec("SELECT version();") {
                if (!it.next()) return@exec "?"

                val version = it.getString("version")
                it.close()

                return@exec version
            }!!
        }

        val uptime = asyncTransaction {
            exec("SELECT extract(epoch FROM current_timestamp - pg_postmaster_start_time()) AS uptime;") {
                if (!it.next()) return@exec 0.1

                val uptime = it.getDouble("uptime")
                it.close()

                uptime
            }
        }

        val fetched = asyncTransaction {
            exec("SELECT tup_fetched FROM pg_stat_database;") {
                if (!it.next()) return@exec 0L

                val fetched = it.getLong("tup_fetched")
                it.close()

                fetched
            }
        }

        val deleted = asyncTransaction {
            exec("SELECT tup_deleted FROM pg_stat_database;") {
                if (!it.next()) return@exec 0L

                val deleted = it.getLong("tup_deleted")
                it.close()

                deleted
            }
        }

        val updated = asyncTransaction {
            exec("SELECT tup_updated FROM pg_stat_database;") {
                if (!it.next()) return@exec 0L

                val updated = it.getLong("tup_updated")
                it.close()

                updated
            }
        }

        val inserted = asyncTransaction {
            exec("SELECT tup_inserted FROM pg_stat_database;") {
                if (!it.next()) return@exec 0L

                val inserted = it.getLong("tup_inserted")
                it.close()

                inserted
            }
        }

        return DatabaseStats(
            version = if (version == "?") "?" else version.split(" ")[1],
            uptime = floor(uptime!! * 1000.0).milliseconds.inWholeMilliseconds,
            ping = sw.getTime(TimeUnit.MILLISECONDS),
            fetched = fetched!!,
            updated = updated!!,
            deleted = deleted!!,
            inserted = inserted!!
        )
    }
}
