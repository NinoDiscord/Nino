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

package sh.nino.discord.commands.system

import dev.kord.core.Kord
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDateTime
import org.jetbrains.exposed.sql.transactions.transaction
import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.annotations.Subcommand
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandCategory
import sh.nino.discord.core.command.CommandMessage
import sh.nino.discord.core.database.tables.BanType
import sh.nino.discord.core.database.tables.GlobalBans
import sh.nino.discord.core.database.transactions.asyncTransaction
import sh.nino.discord.extensions.asSnowflake

@Command(
    name = "globalbans",
    description = "Adds, removes, updates, or lists all global bans.",
    usage = "[\"add\"|\"remove\"|\"view\"] [id]",
    ownerOnly = true,
    aliases = ["bans", "gbans"],
    category = CommandCategory.SYSTEM
)
class GlobalBansCommand(private val kord: Kord): AbstractCommand() {
    override suspend fun run(msg: CommandMessage) {
        val emptyBans = transaction {
            GlobalBans.all().notForUpdate().empty()
        }

        if (emptyBans) {
            msg.reply("There are no global bans available.")
            return
        }

        val bans = asyncTransaction {
            GlobalBans.all().notForUpdate()
        }.execute()

        msg.reply(
            buildString {
                appendLine("__**Global Bans**__")
                appendLine("-+ ${bans.filter { it.type == BanType.GUILD }.size} guilds")
                appendLine("-+ ${bans.filter { it.type == BanType.USER }.size} users")
            }
        )
    }

    @Subcommand(name = "add", description = "Adds a entity to the bans list.", aliases = ["+"])
    suspend fun add(msg: CommandMessage) {
        if (msg.args.isEmpty()) {
            msg.reply("Missing entity ID to ban.")
            return
        }

        val id = msg.args.first().asSnowflake()
        val guild = kord.getGuild(id)
        val user = kord.getUser(id)
        val reason = msg.args.drop(1).joinToString(" ")

        if (guild != null) {
            asyncTransaction {
                GlobalBans.new(guild.id.value.toLong()) {
                    createdAt = LocalDateTime.parse(Clock.System.now().toString())
                    issuer = msg.author.id.value.toLong()
                    type = BanType.GUILD

                    if (reason.isNotBlank()) {
                        this.reason = reason
                    }

                    // TODO: expirations
                }
            }.execute()

            msg.reply(":thumbsup: Added guild **${guild.name}** (${guild.id.asString}) to the bans list.")
            return
        }

        if (user != null) {
            asyncTransaction {
                GlobalBans.new(user.id.value.toLong()) {
                    createdAt = LocalDateTime.parse(Clock.System.now().toString())
                    issuer = msg.author.id.value.toLong()
                    type = BanType.USER

                    if (reason.isNotBlank()) {
                        this.reason = reason
                    }

                    // TODO: expirations
                }
            }.execute()

            msg.reply(":thumbsup: Added user **${user.tag}** (${user.id.asString}) to the bans list.")
            return
        }

        msg.reply(":question: Unknown guild/user: **${id.asString}**")
    }
}
