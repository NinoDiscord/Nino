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

package sh.nino.discord.commands.admin

import dev.kord.common.entity.Permission
import org.jetbrains.exposed.sql.update
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.commands.annotations.Subcommand
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.extensions.findIndex
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.GuildSettings
import sh.nino.discord.database.tables.Users

@Command(
    name = "prefix",
    description = "descriptions.admin.prefix",
    usage = "[\"set\" | \"view\" | \"delete\"] [prefix] [--user]",
    examples = [
        "{prefix}prefix | Views the custom guild's prefixes",
        "{prefix}prefix --user/-u | Views your custom prefixes!",
        "{prefix}prefix set ! | Set the guild's prefix, requires Manage Guild permission (without --user/-u flag)!",
        "{prefix}prefix delete ! | Removes a guild prefix, requires the Manage Guild permission (without --user/-u flag)!"
    ]
)
class PrefixCommand(private val config: Config): AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        val isUserFlagThere = (msg.flags["user"] ?: msg.flags["u"])?.asBooleanOrNull ?: false
        if (isUserFlagThere) {
            val prefixes = msg.userSettings.prefixes.toList()
            msg.replyTranslate(
                "commands.admin.prefix.user.list",
                mapOf(
                    "user" to msg.author.tag,
                    "list" to prefixes.mapIndexed { i, prefix ->
                        "• $i. ${prefix.trim()} <command> [...args]"
                    }.joinToString("\n").ifEmpty {
                        msg.locale.translate("generic.nothing")
                    },

                    "prefixes" to config.prefixes.mapIndexed { i, prefix ->
                        "• $i. ${prefix.trim()} <command> [...args]"
                    }.joinToString("\n")
                )
            )

            return
        }

        val prefixes = msg.settings.prefixes.toList()
        val guild = msg.message.getGuild()

        msg.replyTranslate(
            "commands.admin.prefix.guild.list",
            mapOf(
                "name" to guild.name,
                "list" to prefixes.mapIndexed { i, prefix ->
                    "• $i. ${prefix.trim()} <command> [...args]"
                }.joinToString("\n").ifEmpty {
                    msg.locale.translate("generic.nothing")
                },

                "prefixes" to config.prefixes.mapIndexed { i, prefix ->
                    "• $i. ${prefix.trim()} <command> [...args]"
                }.joinToString("\n")
            )
        )
    }

    @Subcommand(
        "set",
        "descriptions.admin.prefix.set",
        aliases = ["s", "add", "a"],
        usage = "<prefix{0..25}>"
    )
    suspend fun set(msg: CommandMessage) {
        val isUser = (msg.flags["user"] ?: msg.flags["u"])?.asBooleanOrNull ?: false
        val permissions = msg.message.getAuthorAsMember()!!.getPermissions()

        if (!isUser && (!permissions.contains(Permission.ManageGuild) || !config.owners.contains("${msg.author.id}"))) {
            msg.replyTranslate("commands.admin.prefix.set.noPermission")
            return
        }

        if (msg.args.isEmpty()) {
            msg.replyTranslate("commands.admin.prefix.set.missingPrefix")
            return
        }

        val prefix = msg.args.joinToString(" ").replace("['\"]".toRegex(), "")
        if (prefix.length > 25) {
            msg.replyTranslate(
                "commands.admin.prefix.set.maxLengthExceeded",
                mapOf(
                    "prefix" to prefix,
                    "chars.over" to prefix.length - 25
                )
            )

            return
        }

        if (isUser) {
            val index = msg.userSettings.prefixes.findIndex {
                it.lowercase() == prefix.lowercase()
            }

            if (index != -1) {
                msg.replyTranslate("commands.admin.prefix.set.alreadySet", mapOf("prefix" to prefix))
                return
            }

            val prefixesToAdd = msg.userSettings.prefixes + arrayOf(prefix)

            asyncTransaction {
                Users.update({
                    Users.id eq msg.author.id.value.toLong()
                }) {
                    it[prefixes] = prefixesToAdd
                }
            }

            msg.replyTranslate("commands.admin.prefix.set.available", mapOf("prefix" to prefix))
        } else {
            val index = msg.settings.prefixes.findIndex {
                it.lowercase() == prefix.lowercase()
            }

            if (index != -1) {
                msg.replyTranslate("commands.admin.prefix.set.alreadySet", mapOf("prefix" to prefix))
                return
            }

            val prefixesToAdd = msg.settings.prefixes + arrayOf(prefix)

            asyncTransaction {
                GuildSettings.update({
                    GuildSettings.id eq msg.guild.id.value.toLong()
                }) {
                    it[prefixes] = prefixesToAdd
                }
            }

            msg.replyTranslate("commands.admin.prefix.set.available", mapOf("prefix" to prefix))
        }
    }

    @Subcommand("reset", "descriptions.admin.prefix.reset")
    suspend fun reset(msg: CommandMessage) {
        val isUser = (msg.flags["user"] ?: msg.flags["u"])?.asBooleanOrNull ?: false
        if (msg.args.isEmpty()) {
            return if (isUser) {
                displaySelectionForUser(msg)
            } else {
                displaySelectionForGuild(msg)
            }
        }

        val prefix = msg.args.joinToString(" ").replace("['\"]".toRegex(), "")
        if (prefix.length > 25) {
            msg.replyTranslate(
                "commands.admin.prefix.set.maxLengthExceeded",
                mapOf(
                    "prefix" to prefix,
                    "chars.over" to prefix.length - 25
                )
            )

            return
        }

        if (isUser) {
            val index = msg.userSettings.prefixes.findIndex {
                it.lowercase() == prefix.lowercase()
            }

            if (index == -1) {
                msg.replyTranslate("commands.admin.prefix.reset.alreadyRemoved", mapOf("prefix" to prefix))
                return
            }

            val prefixesToRemove = msg.userSettings.prefixes.filter {
                it.lowercase() == prefix.lowercase()
            }.toTypedArray()

            asyncTransaction {
                Users.update({
                    Users.id eq msg.author.id.value.toLong()
                }) {
                    it[prefixes] = prefixesToRemove
                }
            }

            msg.replyTranslate("commands.admin.prefix.reset.unavailable", mapOf("prefix" to prefix))
        } else {
            val index = msg.settings.prefixes.findIndex {
                it.lowercase() == prefix.lowercase()
            }

            if (index == -1) {
                msg.replyTranslate("commands.admin.prefix.reset.alreadyRemoved", mapOf("prefix" to prefix))
                return
            }

            val prefixesToRemove = msg.settings.prefixes.filter {
                it.lowercase() != prefix.lowercase()
            }.toTypedArray()

            asyncTransaction {
                GuildSettings.update({
                    GuildSettings.id eq msg.guild.id.value.toLong()
                }) {
                    it[prefixes] = prefixesToRemove
                }
            }

            msg.replyTranslate("commands.admin.prefix.reset.unavailable", mapOf("prefix" to prefix))
        }
    }

    private suspend fun displaySelectionForUser(msg: CommandMessage) {
        val prefixes = msg.userSettings.prefixes.toList()
        msg.reply {
            title = msg.locale.translate("commands.admin.prefix.reset.user.embed.title", mapOf("name" to msg.author.tag))
            description = msg.locale.translate(
                "commands.admin.prefix.reset.user.embed.description",
                mapOf(
                    "prefixes" to prefixes.mapIndexed { i, prefix ->
                        "• $i. \"${prefix.trim()} <command> [...args / --flags]"
                    }.joinToString("\n").ifEmpty {
                        msg.locale.translate("generic.nothing")
                    }
                )
            )
        }
    }

    private suspend fun displaySelectionForGuild(msg: CommandMessage) {
        val prefixes = msg.settings.prefixes.toList()
        msg.reply {
            title = msg.locale.translate("commands.admin.prefix.reset.guild.embed.title", mapOf("name" to msg.guild.name))
            description = msg.locale.translate(
                "commands.admin.prefix.reset.guild.embed.description",
                mapOf(
                    "prefixes" to prefixes.mapIndexed { i, prefix ->
                        "• $i. \"${prefix.trim()} <command> [...args / --flags]"
                    }.joinToString("\n").ifEmpty {
                        msg.locale.translate("generic.nothing")
                    },

                    "config.prefixes" to config.prefixes.joinToString(", ")
                )
            )
        }
    }
}
