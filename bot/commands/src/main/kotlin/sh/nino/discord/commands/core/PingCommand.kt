/*
 * 🔨 Nino: Cute, advanced discord moderation bot made in Kord.
 * Copyright (c) 2019-2022 Nino Team
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

import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import org.apache.commons.lang3.time.StopWatch
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.common.DEDI_NODE
import sh.nino.discord.common.extensions.humanize
import sh.nino.discord.common.extensions.runSuspended
import sh.nino.discord.core.redis.RedisManager
import sh.nino.discord.database.asyncTransaction
import java.util.concurrent.TimeUnit

@Command(
    "ping",
    "descriptions.core.ping",
    aliases = ["amionline", "pang", "peng", "pong", "pung", "latency"],
    cooldown = 2
)
class PingCommand(private val redis: RedisManager): AbstractCommand() {
    private val messages = listOf(
        "what does the fox say?",
        ":fox:",
        ":polar_bear:",
        "im a pretty girl, im a pretty girl!",
        "im the best quintuplet!",
        "sometimes, life sucks! but, you'll get better! <3",
        "yiff",
        ":thinking: are potatoes really food?"
    )

    override suspend fun execute(msg: CommandMessage) {
        val random = messages.random()

        val stopwatch = StopWatch.createStarted()
        val message = msg.reply(random)
        stopwatch.stop()

        val delStopwatch = StopWatch.createStarted()
        message.delete()
        delStopwatch.stop()

        // Now, we calculate Redis + Postgre ping
        val redisPing = redis.getPing().inWholeMilliseconds
        val postgresPing = runSuspended {
            val sw = StopWatch.createStarted()
            asyncTransaction {
                exec("SELECT 1;") {
                    it.close()
                }
            }

            sw.stop()
            sw.getTime(TimeUnit.MILLISECONDS)
        }

        val (shardId) = msg.kord.guilds.map {
            ((it.id.value.toLong() shr 22) % msg.kord.gateway.gateways.size) to it.id.value.toLong()
        }.filter {
            it.second == msg.guild.id.value.toLong()
        }.first()

        val gateway = msg.kord.gateway.gateways[shardId.toInt()]!!
        msg.reply(
            buildString {
                if (DEDI_NODE != "none") {
                    appendLine(":satellite_orbital: Running under node **$DEDI_NODE**")
                    appendLine()
                }

                appendLine("**Deleting Messages**: ${delStopwatch.getTime(TimeUnit.MILLISECONDS).humanize(long = false, includeMs = true)}")
                appendLine("**Sending Messages**: ${stopwatch.getTime(TimeUnit.MILLISECONDS).humanize(long = false, includeMs = true)}")
                appendLine("**Shard #$shardId**: ${if (gateway.ping.value == null) "?" else gateway.ping.value!!.inWholeMilliseconds.humanize(long = false, includeMs = true)}")
                appendLine("**All Shards**: ${if (msg.guild.kord.gateway.averagePing == null) "" else msg.guild.kord.gateway.averagePing!!.inWholeMilliseconds.humanize(long = false, includeMs = true)}")
                appendLine("**PostgreSQL**: ${postgresPing.humanize(long = false, includeMs = true)}")
                appendLine("**Redis**: ${redisPing.humanize(long = false, includeMs = true)}")
            }
        )
    }
}
