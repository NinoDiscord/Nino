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

package sh.nino.discord.core.listeners

import dev.kord.common.entity.ActivityType
import dev.kord.core.Kord
import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.entity.channel.TextChannel
import dev.kord.core.event.guild.GuildDeleteEvent
import dev.kord.core.on
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.sql.deleteWhere
import org.koin.core.context.GlobalContext
import org.slf4j.LoggerFactory
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.extensions.asSnowflake
import sh.nino.discord.common.extensions.runSuspended
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.*
import sh.nino.discord.metrics.MetricsRegistry

fun Kord.applyGuildEvents() {
    val log = LoggerFactory.getLogger("sh.nino.discord.core.listeners.GuildListenerKt")
    val koin = GlobalContext.get()
    val metrics = koin.get<MetricsRegistry>()
    val config = koin.get<Config>()

    // this is commented out due to:
    // https://canary.discord.com/channels/556525343595298817/631147109311053844/936066300218835014

//    on<GuildCreateEvent> {
//        log.info("New Guild Joined - ${guild.name} (${guild.id})")
//        asyncTransaction {
//            GuildSettingsEntity.new(guild.id.value.toLong()) {}
//            AutomodEntity.new(guild.id.value.toLong()) {}
//            LoggingEntity.new(guild.id.value.toLong()) {}
//        }
//
//        metrics.guildCount?.inc()
//        kord.getChannelOf<TextChannel>("844410521599737878".asSnowflake())?.runSuspended {
//            val humans = this@on.guild.members.filter {
//                !it.isBot
//            }.toList()
//
//            val bots = this@on.guild.members.filter {
//                it.isBot
//            }.toList()
//
//            val ratio = ((humans.size * bots.size) / this@on.guild.members.toList().size).toDouble()
//            val owner = this@on.guild.owner.asMember()
//
//            createMessage(
//                buildString {
//                    appendLine("```md")
//                    appendLine("# Joined ${this@on.guild.name} (${this@on.guild.id})")
//                    appendLine()
//                    appendLine("• Members [ Bots / Total ]: ${bots.size} / ${humans.size} ($ratio%)")
//                    appendLine("• Owner: ${owner.tag} (${owner.id})")
//                    appendLine("```")
//                }
//            )
//
//            val currStatus = config.status.status
//                .replace("{shard_id}", shard.toString())
//                .replace("{guilds}", kord.guilds.toList().size.toString())
//
//            kord.editPresence {
//                status = config.status.presence
//                when (config.status.type) {
//                    ActivityType.Listening -> listening(currStatus)
//                    ActivityType.Game -> playing(currStatus)
//                    ActivityType.Competing -> competing(currStatus)
//                    ActivityType.Watching -> watching(currStatus)
//                    else -> {
//                        playing(currStatus)
//                    }
//                }
//            }
//        }
//    }

    on<GuildDeleteEvent> {
        if (unavailable) {
            log.warn("Guild ${guild?.name ?: "(unknown)"} (${guild?.id ?: "(unknown ID)"}) went unavailable, not doing anything.")
            return@on
        }

        if (guild == null) {
            log.warn("Left uncached guild, cannot say anything about it. :<")
            return@on
        }

        log.info("Left Guild - ${guild!!.name} (${guild!!.id})")
        asyncTransaction {
            GuildSettings.deleteWhere {
                GuildSettings.id eq guild!!.id.value.toLong()
            }

            AutomodTable.deleteWhere {
                AutomodTable.id eq guild!!.id.value.toLong()
            }

            GuildLogging.deleteWhere {
                GuildLogging.id eq guild!!.id.value.toLong()
            }
        }

        metrics.guildCount?.dec()
        kord.getChannelOf<TextChannel>("844410521599737878".asSnowflake())?.runSuspended {
            val humans = this@on.guild!!.members.filter {
                !it.isBot
            }.toList()

            val bots = this@on.guild!!.members.filter {
                it.isBot
            }.toList()

            val ratio = ((humans.size * bots.size) / this@on.guild!!.members.toList().size).toDouble()
            val owner = this@on.guild!!.owner.asMember()

            createMessage(
                buildString {
                    appendLine("```md")
                    appendLine("# Left ${this@on.guild!!.name} (${this@on.guild!!.id})")
                    appendLine()
                    appendLine("• Members [ Bots / Total ]: ${bots.size} / ${humans.size} ($ratio%)")
                    appendLine("• Owner: ${owner.tag} (${owner.id})")
                    appendLine("```")
                }
            )

            val currStatus = config.status.status
                .replace("{shard_id}", shard.toString())
                .replace("{guilds}", kord.guilds.toList().size.toString())

            kord.editPresence {
                status = config.status.presence
                when (config.status.type) {
                    ActivityType.Listening -> listening(currStatus)
                    ActivityType.Game -> playing(currStatus)
                    ActivityType.Competing -> competing(currStatus)
                    ActivityType.Watching -> watching(currStatus)
                    else -> {
                        playing(currStatus)
                    }
                }
            }
        }
    }
}
