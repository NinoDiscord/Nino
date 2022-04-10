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

@file:Suppress("UNUSED")
package sh.nino.discord.commands.admin

import kotlinx.coroutines.launch
import org.jetbrains.exposed.sql.update
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.commands.annotations.Subcommand
import sh.nino.discord.core.NinoScope
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.AutomodEntity
import sh.nino.discord.database.tables.AutomodTable
import java.util.*

@Command(
    name = "automod",
    description = "descriptions.admin.automod",
    aliases = ["am"],
    category = CommandCategory.ADMIN,
    userPermissions = [0x00000020] // ManageGuild
)
class AutomodCommand: AbstractCommand() {
    private val messageRemoverTimer = Timer("Nino-MessageRemoverTimer")
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
                appendLine("• ${enabled(settings.invites)} **Toxicity**")
                appendLine("• ${enabled(settings.invites)} **Invites**")
                appendLine("• ${enabled(settings.invites)} **Raid**")
                appendLine("• ${enabled(settings.invites)} **Spam**")
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
        aliases = ["age", "accAge", "ac"],
        usage = "[days]"
    )
    suspend fun accountAge(msg: CommandMessage) {
        val guild = msg.message.getGuild()

        if (msg.args.isEmpty()) {
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

            return
        }

        val days = msg.args.first()
        try {
            Integer.parseInt(days)
        } catch (e: NumberFormatException) {
            msg.reply("The amount of days specified was not a correct number.")
            return
        }

        val numOfDays = Integer.parseInt(days)
        if (numOfDays <= 0) {
            msg.reply("Number of days cannot go below zero.")
            return
        }

        if (numOfDays >= 14) {
            msg.reply("Number of days cannot go over 14 days. :<")
            return
        }

        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[accountAgeDayThreshold] = numOfDays
            }
        }

        msg.reply("<:success:464708611260678145> Successfully set the day threshold to **$numOfDays** days~")
    }

    @Subcommand(
        "dehoist",
        "descriptions.automod.dehoist",
        aliases = ["dehoisting", "dh"]
    )
    suspend fun dehoist(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        val prop = !settings.dehoisting
        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[dehoisting] = prop
            }
        }

        msg.replyTranslate(
            "commands.automod.toggle",
            mapOf(
                "emoji" to enabled(prop),
                "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                "name" to "Dehoisting"
            )
        )
    }

    @Subcommand(
        "shortlinks",
        "descriptions.automod.shortlinks",
        aliases = ["sl", "links"]
    )
    suspend fun shortlinks(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        val prop = !settings.shortlinks
        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[shortlinks] = prop
            }
        }

        msg.replyTranslate(
            "commands.automod.toggle",
            mapOf(
                "emoji" to enabled(prop),
                "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                "name" to "Shortlinks"
            )
        )
    }

    @Subcommand(
        "blacklist",
        "descriptions.automod.blacklist",
        usage = "[\"list\" | \"set <words...>\" | \"remove <words...>\"]"
    )
    suspend fun blacklist(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        if (msg.args.isEmpty()) {
            val settings = asyncTransaction {
                AutomodEntity.findById(guild.id.value.toLong())!!
            }

            val prop = !settings.blacklist
            asyncTransaction {
                AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                    it[blacklist] = prop
                }
            }

            msg.replyTranslate(
                "commands.automod.toggle",
                mapOf(
                    "emoji" to enabled(prop),
                    "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                    "name" to "Blacklist"
                )
            )

            return
        }

        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        when (msg.args.first()) {
            "remove", "del", "delete" -> {
                val words = msg.args.drop(1)
                if (words.isEmpty()) {
                    msg.reply("Missing words to remove from the blacklist.")
                    return
                }

                val wordsRemaining = settings.blacklistedWords.filter { words.contains(it) }
                asyncTransaction {
                    AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                        it[blacklistedWords] = wordsRemaining.toTypedArray()
                    }
                }

                msg.reply("Successfully removed **${words.size}** words from the blacklist.")
            }

            "list" -> {
                val original = msg.reply {
                    title = "[ Blacklisted Words in ${guild.name} ]"
                    description = buildString {
                        appendLine("Due to the nature of some words (that can be blacklisted)")
                        appendLine("This message will be deleted in roughly 5 seconds from now.")
                        appendLine()

                        for (word in settings.blacklistedWords.toList().chunked(5)) {
                            append("• **${word.joinToString(", ")}**")
                        }
                    }
                }

                messageRemoverTimer.schedule(
                    object: TimerTask() {
                        override fun run() {
                            NinoScope.launch { original.delete() }
                        }
                    },
                    5000L
                )
            }

            "add", "set" -> {
                val words = msg.args.drop(1)

                asyncTransaction {
                    AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                        it[blacklistedWords] = words.toTypedArray() + settings.blacklistedWords
                    }
                }

                msg.reply("Successfully added **${words.size}** new blacklisted words. :D")
            }

            else -> msg.reply("Missing subsubcommand: `add`, `list`, or `remove`")
        }
    }

    @Subcommand(
        "phishing",
        "descriptions.automod.phishing",
        aliases = ["phish", "fish", "\uD83D\uDC1F"]
    )
    suspend fun phishing(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        val prop = !settings.phishing
        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[phishing] = prop
            }
        }

        msg.replyTranslate(
            "commands.automod.toggle",
            mapOf(
                "emoji" to enabled(prop),
                "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                "name" to "Phishing Links"
            )
        )
    }

    @Subcommand(
        "mentions",
        "descriptions.automod.dehoist",
        aliases = ["@mention", "@"],
        usage = "[threshold]"
    )
    suspend fun mentions(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        if (msg.args.isEmpty()) {
            val prop = !settings.mentions
            asyncTransaction {
                AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                    it[mentions] = prop
                }
            }

            msg.replyTranslate(
                "commands.automod.toggle",
                mapOf(
                    "emoji" to enabled(prop),
                    "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                    "name" to "Dehoisting"
                )
            )

            return
        }

        val threshold = msg.args.first()
        try {
            Integer.parseInt(threshold)
        } catch (e: NumberFormatException) {
            msg.reply("The mention threshold should be a valid number.")
            return
        }

        val numOfMentions = Integer.parseInt(threshold)
        if (numOfMentions <= 0) {
            msg.reply("Cannot below zero. You can just... disable the automod, you know?")
            return
        }

        if (numOfMentions >= 25) {
            msg.reply("Cannot above 25 mentions, don't think that'll be possible...")
            return
        }

        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[mentionsThreshold] = numOfMentions
            }
        }

        msg.reply("<:success:464708611260678145> Successfully set the mention threshold to **$numOfMentions** mentions~")
    }

    @Subcommand(
        "toxicity",
        "descriptions.automod.toxicity",
        aliases = ["toxic"]
    )
    suspend fun toxicity(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        val prop = !settings.toxicity
        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[toxicity] = prop
            }
        }

        msg.replyTranslate(
            "commands.automod.toggle",
            mapOf(
                "emoji" to enabled(prop),
                "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                "name" to "Toxicity"
            )
        )
    }

    @Subcommand(
        "spam",
        "descriptions.automod.spam"
    )
    suspend fun spam(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        val prop = !settings.spam
        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[spam] = prop
            }
        }

        msg.replyTranslate(
            "commands.automod.toggle",
            mapOf(
                "emoji" to enabled(prop),
                "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                "name" to "Spam"
            )
        )
    }

    @Subcommand(
        "raid",
        "descriptions.automod.raid",
        aliases = ["raids"]
    )
    suspend fun raid(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        val prop = !settings.raid
        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[raid] = prop
            }
        }

        msg.replyTranslate(
            "commands.automod.toggle",
            mapOf(
                "emoji" to enabled(prop),
                "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                "name" to "Raid"
            )
        )
    }

    @Subcommand(
        "invites",
        "descriptions.automod.invites",
        aliases = ["inv", "dinv"]
    )
    suspend fun invites(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        val prop = !settings.invites
        asyncTransaction {
            AutomodTable.update({ AutomodTable.id eq guild.id.value.toLong() }) {
                it[invites] = prop
            }
        }

        msg.replyTranslate(
            "commands.automod.toggle",
            mapOf(
                "emoji" to enabled(prop),
                "toggle" to msg.locale.translate("generic.${if (prop) "enabled" else "disabled"}"),
                "name" to "Invites"
            )
        )
    }
}
