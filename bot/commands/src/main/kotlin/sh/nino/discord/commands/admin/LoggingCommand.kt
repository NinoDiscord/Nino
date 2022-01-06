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

@file:Suppress("UNUSED")
package sh.nino.discord.commands.admin

import dev.kord.core.Kord
import org.jetbrains.exposed.sql.update
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.commands.annotations.Subcommand
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.GuildLogging
import sh.nino.discord.database.tables.LoggingEntity

@Command(
    name = "logging",
    description = "descriptions.admin.logging",
    category = CommandCategory.ADMIN,
    aliases = ["log"],
    userPermissions = [0x00000020] // ManageGuild
)
class LoggingCommand(private val kord: Kord): AbstractCommand() {
    private fun enabled(value: Boolean): String = if (value) {
        "<:success:464708611260678145>"
    } else {
        "<:xmark:464708589123141634>"
    }

    override suspend fun execute(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            LoggingEntity.findById(guild.id.value.toLong())!!
        }

        val prop = !settings.enabled
        asyncTransaction {
            GuildLogging.update({ GuildLogging.id eq guild.id.value.toLong() }) {
                it[enabled] = prop
            }
        }

        msg.replyTranslate(
            "commands.admin.logging.toggle",
            mapOf(
                "emoji" to enabled(prop),
                "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}")
            )
        )
    }

    @Subcommand(
        "users",
        "descriptions.logging.omitUsers",
        aliases = ["u", "uomit"]
    )
    suspend fun omitUsers(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        if (msg.args.isEmpty()) {
            val settings = asyncTransaction {
                LoggingEntity.findById(guild.id.value.toLong())!!
            }

            msg.reply {
                title = msg.locale.translate("commands.admin.logging.omitUsers.embed.title")
                description = msg.locale.translate(
                    "commands.admin.logging.omitUsers.embed.description",
                    mapOf(
                        "list" to msg.locale.translate("generic.lonely")
                    )
                )
            }
        }

        when (msg.args.first()) {
            "add", "+" -> {
                msg.replyTranslate("generic.lonely")
            }

            "remove", "del", "-" -> {
                msg.replyTranslate("generic.lonely")
            }
        }
    }

    /*
    if (msg.args.isEmpty()) {
            msg.replyTranslate("commands.admin.logging.omitUsers.missingArgs")
            return
        }

        val users = getMutipleUsersFromArgs(msg.args).map { it.id }
        if (users.isEmpty()) {
            msg.replyTranslate("commands.admin.logging.omitUsers.404")
            return
        }

        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            LoggingEntity.findById(guild.id.value.toLong())!!
        }

        asyncTransaction {
            GuildLogging.update({ GuildLogging.id eq guild.id.value.toLong() }) { up ->
                up[ignoredUsers] = settings.ignoredUsers + users.map { it.value.toLong() }.toTypedArray()
            }
        }

        val length = (settings.ignoredUsers + users.map { it.value.toLong() }.toTypedArray()).size
        msg.replyTranslate("commands.admin.logging.omitUsers.success", mapOf(
            "users" to length,
            "suffix" to if (length != 0 && length == 1) "" else "s"
        ))
     */

    @Subcommand(
        "channels",
        "descriptions.logging.omitChannels",
        aliases = ["c", "comit", "comet", "☄️"] // "comet" and the comet emoji are just... easter eggs I think?
    )
    suspend fun omitChannels(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        if (msg.args.isEmpty()) {
            val settings = asyncTransaction {
                LoggingEntity.findById(guild.id.value.toLong())!!
            }

            msg.reply {
                title = msg.locale.translate("commands.admin.logging.omitUsers.embed.title")
                description = msg.locale.translate(
                    "commands.admin.logging.omitUsers.embed.description",
                    mapOf(
                        "list" to msg.locale.translate("generic.lonely")
                    )
                )
            }
        }

        when (msg.args.first()) {
            "add", "+" -> {
                msg.replyTranslate("generic.lonely")
            }

            "remove", "del", "-" -> {
                msg.replyTranslate("generic.lonely")
            }
        }
    }

    @Subcommand(
        "events",
        "descriptions.logging.events",
        aliases = ["ev", "event"],
        usage = "<\"*\" | \"list\" | \"enable [events...]\" | \"disable [events...]\">"
    )
    suspend fun events(msg: CommandMessage) {
        msg.replyTranslate("generic.lonely")
    }
}
