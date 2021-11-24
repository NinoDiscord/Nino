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
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandMessage
import kotlin.time.Duration

private data class ShardInfo(
    val guilds: MutableList<Long>,
    var users: Int,
    val ping: Duration
)

@Command(
    name = "shardinfo",
    description = "descriptions.core.shardinfo",
    aliases = ["shards", "si"]
)
class ShardInfoCommand(private val kord: Kord): AbstractCommand() {
    override suspend fun run(msg: CommandMessage) {
        val guildShardMap = kord.guilds.map {
            ((it.id.value.toLong() shr 22) % kord.gateway.gateways.size) to it.id.value.toLong()
        }.toList()

        // TODO: this doesn't probably scale well, but oh well.
        val shards = mutableMapOf<Long, ShardInfo>()
        for ((id, guildId) in guildShardMap) {
            if (!shards.containsKey(id)) {
                shards[id] = ShardInfo(
                    mutableListOf(),
                    0,
                    kord.gateway.gateways[id.toInt()]!!.ping.value ?: Duration.ZERO
                )
            }

            val info = shards[id]!!
            info.guilds.add(guildId)
            info.users += kord.getGuild(Snowflake(guildId))!!.memberCount ?: 0

            shards[id] = info
        }

        val self = kord.getSelf()
        msg.replyEmbed {
            title = "[ ${self.tag} | Shard Information ]"
            description = buildString {
                appendLine("```apache")
                for ((id, info) in shards) {
                    appendLine("* Shard #$id: G: ${info.guilds.size} | U: ${info.users} | L: ${if (info.ping == Duration.ZERO) "?" else "${info.ping.inWholeMilliseconds}ms"}")
                }

                appendLine("```")
            }
        }
    }
}
