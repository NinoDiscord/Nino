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

import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import org.apache.commons.lang3.time.StopWatch
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.common.extensions.asSnowflake
import sh.nino.discord.common.extensions.humanize
import java.util.concurrent.TimeUnit
import kotlin.time.Duration

private data class ShardInfo(
    val guilds: MutableList<Long>,
    var users: Int,
    val ping: Duration
)

@Command(
    "shardinfo",
    "descriptions.core.shardinfo",
    aliases = ["shards"]
)
class ShardInfoCommand: AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        val stopwatch = StopWatch.createStarted()
        val message = msg.reply(":thinking: Now calculating shard information...")

        val guildShardMap = msg.kord.guilds.map {
            ((it.id.value.toLong() shr 22) % msg.kord.gateway.gateways.size) to it.id.value.toLong()
        }.toList()

        // TODO: i don't think this will scale well
        // but, oh well!
        val shardMap = mutableMapOf<Long, ShardInfo>()
        for ((id, guildId) in guildShardMap) {
            if (!shardMap.containsKey(id)) {
                shardMap[id] = ShardInfo(mutableListOf(), 0, msg.kord.gateway.gateways[id.toInt()]!!.ping.value ?: Duration.ZERO)
            }

            val shardInfo = shardMap[id]!!
            shardInfo.guilds.add(guildId)
            shardInfo.users += msg.kord.getGuild(guildId.asSnowflake())!!.memberCount ?: 0

            shardMap[id] = shardInfo
        }

        message.delete()
        stopwatch.stop()

        val currentShard = guildShardMap.first { it.second == msg.guild.id.value.toLong() }.first
        msg.reply(
            buildString {
                appendLine("```md")
                appendLine("# Shard Information")
                appendLine("> Took ${stopwatch.getTime(TimeUnit.MILLISECONDS).humanize(long = false, includeMs = true)} to calculate!")
                appendLine()

                for ((id, info) in shardMap) {
                    appendLine("* Shard #$id${if (currentShard == id) " (Current)" else ""} | G: ${info.guilds.size} - U: ${info.users} - P: ${if (info.ping == Duration.ZERO) "?" else info.ping.inWholeMilliseconds.humanize(long = false, includeMs = true)}")
                }

                appendLine("```")
            }
        )
    }
}
