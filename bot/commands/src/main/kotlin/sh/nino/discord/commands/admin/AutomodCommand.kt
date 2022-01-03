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

import org.jetbrains.exposed.sql.update
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.commands.annotations.Subcommand
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.AutomodEntity
import sh.nino.discord.database.tables.AutomodTable

@Command(
    name = "automod",
    description = "descriptions.admin.automod",
    aliases = ["am"],
    category = CommandCategory.ADMIN,
    userPermissions = [0x00000020] // ManageGuild
)
class AutomodCommand: AbstractCommand() {

    private fun enabled(value: Boolean): String = if (value) {
        "<:success:464708611260678145>"
    } else {
        "<:xmark:464708589123141634>"
    }

    override suspend fun execute(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        msg.reply {
            description = buildString {
                appendLine("• ${enabled(settings.messageLinks)} **Message Links**")
                appendLine("• ${enabled(settings.accountAge)} **Account Age**")
                appendLine("• ${enabled(settings.dehoisting)} **Dehoisting**")
                appendLine("• ${enabled(settings.shortlinks)} **Shortlinks**")
                appendLine("• ${enabled(settings.blacklist)} **Blacklist**")
                appendLine("• ${enabled(settings.phishing)} **Phishing**")
                appendLine("• ${enabled(settings.mentions)} **Mentions**")
                appendLine("• ${enabled(settings.invites)} **Invites**")
            }

            footer {
                text = msg.locale.translate("commands.automod.list.footer")
            }
        }
    }

    @Subcommand(
        "messageLinks",
        "descriptions.automod.messageLinks",
        aliases = ["links", "msglinks", "mlinks", "ml"]
    )
    suspend fun messageLinks(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        val prop = !settings.messageLinks
        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[messageLinks] = prop
            }
        }

        msg.replyTranslate(
            "commands.automod.toggle",
            mapOf(
                "emoji" to enabled(prop),
                "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                "name" to "Message Links"
            )
        )
    }

    @Subcommand(
        "accountAge",
        "descriptions.automod.accountAge",
        aliases = ["age", "accAge"]
    )
    suspend fun accountAge(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        val prop = !settings.accountAge
        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[accountAge] = prop
            }
        }

        msg.replyTranslate(
            "commands.automod.toggle",
            mapOf(
                "emoji" to enabled(prop),
                "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                "name" to "Account Age"
            )
        )
    }
}
