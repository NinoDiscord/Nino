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

package sh.nino.discord.commands

import dev.kord.common.entity.DiscordUser
import dev.kord.common.entity.Snowflake
import dev.kord.core.Kord
import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.cache.data.UserData
import dev.kord.core.entity.User
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.core.firstOrNull
import dev.kord.rest.builder.message.EmbedBuilder
import gay.floof.utils.slf4j.logging
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.future.await
import kotlinx.coroutines.future.future
import kotlinx.coroutines.withContext
import org.jetbrains.exposed.sql.or
import org.koin.core.context.GlobalContext
import sh.nino.discord.automod.core.Container
import sh.nino.discord.common.COLOR
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.data.Environment
import sh.nino.discord.common.extensions.*
import sh.nino.discord.core.NinoBot
import sh.nino.discord.core.NinoScope
import sh.nino.discord.core.localization.LocalizationManager
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.*
import java.io.ByteArrayOutputStream
import java.io.PrintStream
import java.nio.charset.StandardCharsets
import java.util.*
import kotlin.math.round
import kotlin.reflect.jvm.jvmName

class CommandHandler(
    private val config: Config,
    private val kord: Kord,
    private val locales: LocalizationManager,
    private val nino: NinoBot
) {
    val commands: Map<String, Command>
        get() = GlobalContext.retrieveAll<AbstractCommand>()
            .map { it.info.name to Command(it) }
            .asMap()

    private val timer = Timer("Nino-CooldownTimer")

    // TODO: move to caffeine for this(?)
    private val cooldownCache = mutableMapOf<String, MutableMap<String, Int>>()
    private val logger by logging<CommandHandler>()

    suspend fun onCommand(event: MessageCreateEvent) {
        // If the author is a webhook, let's not do anything
        if (event.message.author == null) return

        // If the author is a bot, let's not do anything
        if (event.message.author!!.isBot) return

        // Run all automod based off the event
        Container.execute(event)

        // Retrieve the guild, if `getGuild` returns null,
        // it's most likely we're in a DM.
        val guild = event.getGuild() ?: return

        // Get guild + user settings
        var guildSettings = asyncTransaction {
            GuildSettingsEntity.find {
                GuildSettings.id eq guild.id.value.toLong()
            }.firstOrNull()
        }

        var userSettings = asyncTransaction {
            UserEntity.find {
                Users.id eq event.message.author!!.id.value.toLong()
            }.firstOrNull()
        }

        // Can't find the guild or user settings?
        // Let's create it and override the variable!
        if (guildSettings == null) {
            guildSettings = asyncTransaction {
                GuildSettingsEntity.new(guild.id.value.toLong()) {}
            }
        }

        if (userSettings == null) {
            userSettings = asyncTransaction {
                UserEntity.new(event.message.author!!.id.value.toLong()) {}
            }
        }

        val selfUser = guild.members.firstOrNull { it.id == kord.selfId } ?: return
        val prefixes = (
                listOf("<@${kord.selfId}>", "<@!${kord.selfId}>")
                        + config.prefixes.toList()
                        + guildSettings.prefixes.toList()
                        + userSettings.prefixes.toList()).distinct()

        if (event.message.content.matches("^<@!?${kord.selfId}>$".toRegex())) {
            val prefix = prefixes.drop(2).random()
            event.message.channel.createMessage {
                content = ":wave: Hallo **${event.message.author!!.tag}**!!!!"
                embeds += EmbedBuilder().apply {
                    color = COLOR
                    description = buildString {
                        appendLine("I am **${selfUser.tag}**, I operate as a moderation bot in this guild! (**${guild.name}**)")
                        appendLine("> You can see a list of commands from our [website](https://nino.sh/commands) or invoking the **${prefix}help** command!")
                        appendLine()
                        appendLine("If you wish to invite ${selfUser.username}, please click [here](https://nino.sh/invite) to do so.")
                        appendLine("Nino is also open source! If you wish, you can star the [repository](https://github.com/NinoDiscord/Nino)! :hearts:")
                        appendLine()
                        appendLine("I will get out of your hair senpai, have a good day/evening~")
                    }
                }
            }
        }

        // Find the prefix if we can find any
        val prefix = prefixes.firstOrNull { event.message.content.startsWith(it) } ?: return
        val globalBan = asyncTransaction {
            GlobalBans.find {
                (GlobalBansTable.id eq guild.id.value.toLong()) or (GlobalBansTable.id eq event.message.author!!.id.value.toLong())
            }.firstOrNull()
        }

        if (globalBan != null) {
            event.message.channel.createMessage {
                embeds += EmbedBuilder().apply {
                    color = COLOR

                    val issuer = kord.rest.user.getUser(globalBan.issuer.asSnowflake())
                    description = buildString {
                        append(if (globalBan.type == BanType.USER) "You" else guild.name)
                        appendLine(" was globally banned by ${issuer.username}#${issuer.discriminator}.")
                        appendLine()
                        appendLine("> **${globalBan.reason ?: "(no reason was specified)"}**")
                        appendLine()
                        appendLine("If you think this was a mistake, report it in the [Noelware](https://discord.gg/ATmjFH9kMH) Discord server!")
                    }
                }
            }

            // leave the guild if the ban was from a guild.
            if (globalBan.type == BanType.GUILD) guild.leave()

            return
        }

        val content = event.message.content.substring(prefix.length).trim()
        val (name, args) = content.split("\\s+".toRegex()).pairUp()
        val cmdName = name.lowercase()
        val locale = locales.getLocale(guildSettings.language, userSettings.language)
        val message = CommandMessage(event, args, guildSettings, userSettings, locale)

        val command = commands[cmdName]
            ?: commands.values.firstOrNull { it.aliases.contains(cmdName) }
            ?: return

        if (command.ownerOnly && !config.owners.contains(event.message.author!!.id.toString())) {
            message.reply(locale.translate("errors.ownerOnly", mapOf("name" to cmdName)))
            return
        }

        if (command.userPermissions.values.isNotEmpty() && guild.ownerId != event.message.author!!.id) {
            val member = event.message.getAuthorAsMember()!!
            val missing = command.userPermissions.values.filter {
                !member.getPermissions().contains(it)
            }

            if (missing.isNotEmpty()) {
                val permList = missing.map { perm -> perm::class.jvmName.split("$").last() }
                message.reply(locale.translate("errors.missingPermsUser", mapOf(
                    "perms" to permList
                )))

                return
            }
        }

        if (command.botPermissions.values.isNotEmpty()) {
            val missing = command.userPermissions.values.filter {
                !selfUser.getPermissions().contains(it)
            }

            if (missing.isNotEmpty()) {
                val permList = missing.map { perm -> perm::class.jvmName.split("$").last() }
                message.reply(locale.translate("errors.missingPermsBot", mapOf(
                    "perms" to permList
                )))

                return
            }
        }

        // cooldown stuff
        // this is also pretty bare bones pls dont owo me in the chat
        // ;-;
        if (!cooldownCache.containsKey(command.name))
            cooldownCache[command.name] = mutableMapOf()

        val now = System.currentTimeMillis()
        val timestamps = cooldownCache[command.name]!!
        val amount = command.cooldown * 1000

        // Owners of the bot bypass cooldowns, so... :shrug:
        if (!config.owners.contains(event.message.author!!.id.toString()) && timestamps.containsKey(event.message.author!!.id.toString())) {
            val time = timestamps[event.message.author!!.id.toString()]!! + amount
            if (now < time.toLong()) {
                val left = (time - now) / 1000
                message.reply(locale.translate("errors.cooldown", mapOf(
                    "command" to command.name,
                    "time" to round(left.toDouble())
                )))

                return
            }

            timestamps[event.message.author!!.id.toString()] = now.toInt()
            timer.schedule(object: TimerTask() {
                override fun run() {
                    timestamps.remove(event.message.author!!.id.toString())
                }
            }, amount.toLong())
        }

        // Is there a subcommand? maybe!
        var subcommand: Subcommand? = null
        for (arg in args) {
            if (command.thiz.subcommands.isNotEmpty()) {
                if (command.thiz.subcommands.find { it.name == arg || it.aliases.contains(arg) } != null) {
                    subcommand = command.thiz.subcommands.first { it.name == arg || it.aliases.contains(arg) }
                    break
                }
            }
        }

        if (subcommand != null) {
            val newMsg = CommandMessage(
                event,
                args.drop(1),
                guildSettings,
                userSettings,
                locale
            )

            subcommand.execute(newMsg) { ex, success ->
                logger.info("Subcommand \"$prefix${command.name} ${subcommand.name}\" was executed by ${newMsg.author.tag} (${newMsg.author.id}) in ${guild.name} (${guild.id})")
                if (!success) {
                    onCommandError(newMsg, command.name, ex!!, true)
                }
            }
        } else {
            command.run(message) { ex, success ->
                logger.info("Command \"$prefix${command.name}\" was executed by ${message.author.tag} (${message.author.id}) in ${guild.name} (${guild.id})")
                if (!success) {
                    onCommandError(message, command.name, ex!!, false)
                }
            }
        }
    }

    private suspend fun onCommandError(
        message: CommandMessage,
        name: String,
        exception: Exception,
        isSub: Boolean = false
    ) {
        // Report to Sentry if installed
        nino.sentryReport(exception)

        // Fetch all owners
        val owners = config.owners.map {
            val user = NinoScope.future { kord.getUser(it.asSnowflake()) }.await() ?: User(
                UserData.Companion.from(
                    DiscordUser(
                        id = Snowflake("0"),
                        username = "Unknown User",
                        discriminator = "0000",
                        null
                    )
                ),

                kord
            )

            user.tag
        }

        if (config.environment == Environment.Development) {
            val baos = ByteArrayOutputStream()
            val stream = withContext(Dispatchers.IO) {
                PrintStream(baos, true, StandardCharsets.UTF_8.name())
            }

            stream.use {
                exception.printStackTrace(stream)
            }

            val stacktrace = withContext(Dispatchers.IO) {
                baos.toString(StandardCharsets.UTF_8.name())
            }

            message.reply(buildString {
                appendLine(message.locale.translate("errors.unknown.0", mapOf(
                    "command" to name,
                    "suffix" to if (isSub) {
                        "subcommand"
                    } else {
                        "command"
                    }
                )))

                appendLine(message.locale.translate("errors.unknown.1", mapOf(
                    "owners" to owners.joinToString(", ") { "**$it**" }
                )))

                appendLine()
                appendLine(message.locale.translate("errors.unknown.2"))
                appendLine()
                appendLine("```kotlin")
                appendLine(stacktrace.elipsis(1500))
                appendLine("```")
            })
        } else {
            message.reply(buildString {
                appendLine(message.locale.translate("errors.unknown.0", mapOf(
                    "command" to name,
                    "suffix" to if (isSub) {
                        "subcommand"
                    } else {
                        "command"
                    }
                )))

                appendLine(message.locale.translate("errors.unknown.1", mapOf(
                    "owners" to owners.joinToString(", ") { "**$it**" }
                )))

                appendLine(message.locale.translate("errors.unknown.3"))
            })
        }

        logger.error("Unable to execute command $name:", exception)
    }
}
