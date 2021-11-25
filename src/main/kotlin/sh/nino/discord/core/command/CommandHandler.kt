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

package sh.nino.discord.core.command

import dev.kord.common.entity.DiscordUser
import dev.kord.common.entity.Snowflake
import dev.kord.core.Kord
import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.cache.data.UserData
import dev.kord.core.entity.User
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.rest.builder.message.EmbedBuilder
import io.sentry.Sentry
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.future.future
import org.apache.commons.lang3.time.StopWatch
import org.jetbrains.exposed.sql.or
import org.koin.core.context.GlobalContext
import sh.nino.discord.core.NinoScope
import sh.nino.discord.core.automod.AutomodContainer
import sh.nino.discord.core.database.tables.*
import sh.nino.discord.core.database.transactions.asyncTransaction
import sh.nino.discord.data.Config
import sh.nino.discord.data.Environment
import sh.nino.discord.extensions.asSnowflake
import sh.nino.discord.extensions.elipsis
import sh.nino.discord.kotlin.logging
import sh.nino.discord.modules.localization.LocalizationModule
import sh.nino.discord.modules.prometheus.PrometheusModule
import sh.nino.discord.utils.Constants
import java.io.ByteArrayOutputStream
import java.io.PrintStream
import java.nio.charset.StandardCharsets
import kotlin.reflect.jvm.jvmName

private fun <T, U> List<Pair<T, U>>.toMappedPair(): Map<T, U> {
    val map = mutableMapOf<T, U>()
    for (item in this) {
        map[item.first] = item.second
    }

    return map.toMap()
}

private fun <T> List<T>.separateFirst(): Pair<T, List<T>> = Pair(first(), drop(1))

class CommandHandler(
    private val config: Config,
    private val prometheus: PrometheusModule,
    private val kord: Kord,
    private val localization: LocalizationModule
) {
    val commands: Map<String, Command>
        get() = GlobalContext
            .get()
            .getAll<AbstractCommand>()
            .map { it.info.name to Command(it) }
            .toMappedPair()

    // we'll be removing/adding stuff here, so no need for caffeine (yet)
    private val cooldownCache = mapOf<String, Int>()
    private val logger by logging<CommandHandler>()

    suspend fun onCommand(event: MessageCreateEvent) {
        prometheus.messagesSeen?.inc()

        // If the author is a webhook, do not do anything
        if (event.message.author == null) return

        // If the author is a bot, do not do anything
        if (event.message.author!!.isBot) return

        // Run all automod
        AutomodContainer.execute(event)

        // Retrieve the guild, if there is no guild (i.e, DM)
        val guild = event.getGuild() ?: return
        val author = event.message.author!!

        // Get guild and user settings
        var guildEntity = asyncTransaction {
            GuildEntity.find {
                Guilds.id eq guild.id.value.toLong()
            }.firstOrNull()
        }.execute()

        var userEntity = asyncTransaction {
            UserEntity.find {
                Users.id eq author.id.value.toLong()
            }.firstOrNull()
        }.execute()

        // If we cannot find the guild, let's create a new entry.
        if (guildEntity == null) {
            asyncTransaction {
                GuildEntity.new(guild.id.value.toLong()) {
                    language = "en_US"
                    modlogChannelId = null
                    mutedRoleId = null
                    noThreadsRoleId = null
                    prefixes = arrayOf()
                }
            }.execute()

            guildEntity = asyncTransaction {
                GuildEntity.find {
                    Guilds.id eq guild.id.value.toLong()
                }.first()
            }.execute()
        }

        // If we cannot find the user, let's create a new entry.
        if (userEntity == null) {
            asyncTransaction {
                UserEntity.new(author.id.value.toLong()) {
                    language = "en_US"
                    prefixes = arrayOf()
                }
            }.execute()

            userEntity = asyncTransaction {
                UserEntity.find {
                    Users.id eq author.id.value.toLong()
                }.first()
            }.execute()
        }

        // now we find which prefix was invoked
        val self = guild.members.firstOrNull { it.id.asString == kord.selfId.asString } ?: return
        val prefixes = (
            listOf(
                "<@${kord.selfId.asString}>",
                "<@!${kord.selfId.asString}>"
            ) + config.prefixes.toList() + guildEntity.prefixes.toList() + userEntity.prefixes.toList()
            ).distinct() // distinct will remove any duplicates

        if (event.message.content.matches("^<@!?${kord.selfId.asString}>$".toRegex())) {
            val prefix = prefixes.drop(2).random()
            event.message.channel.createMessage {
                content = ":wave: Hello, **${author.username}#${author.discriminator}**"
                embeds += EmbedBuilder().apply {
                    color = Constants.COLOR
                    description = buildString {
                        appendLine("I am **${self.tag}**, I operate as a moderation bot in this guild! (**${guild.name}**)")
                        appendLine("> You can see a list of commands from our [website](https://nino.sh/commands) or invoking the **${prefix}help** command!")
                        appendLine()
                        appendLine("If you wish to invite ${self.username}, please click [here](https://nino.sh/invite) to do so.")
                        appendLine("Nino is also open source! If you wish, you can star the [repository](https://github.com/NinoDiscord/Nino)! :hearts:")
                        appendLine()
                        appendLine("I will get out of your hair senpai, have a good day/evening~")
                    }
                }
            }

            return
        }

        // recursively find the prefix, if we can't find it
        val prefix = prefixes.firstOrNull { event.message.content.startsWith(it) } ?: return

        // check for global bans for user/guild
        val globalBan = asyncTransaction {
            GlobalBans.find {
                (GlobalBansTable.id eq guild.id.value.toLong()) or (GlobalBansTable.id eq author.id.value.toLong())
            }.firstOrNull()
        }.execute()

        if (globalBan != null) {
            event.message.channel.createMessage {
                embeds += EmbedBuilder().apply {
                    color = Constants.COLOR

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

        // command handling stage.
        val content = event.message.content.substring(prefix.length).trim()
        val (name, args) = content.split("\\s+".toRegex()).separateFirst()
        val cmdName = name.lowercase()

        val locale = localization.get(guildEntity.language, userEntity.language)
        val message = CommandMessage(event, args, guildEntity, userEntity, locale)

        val command = commands[cmdName]
            ?: commands.values.firstOrNull { it.aliases.contains(name) }
            ?: return

        if (command.ownerOnly && !config.owners.contains(author.id.asString)) {
            message.reply("You do not have permission to execute the **$name** command.")
            return
        }

        // if there is permissions for the user, let's check.
        if (command.userPermissions.values.isNotEmpty()) {
            val member = author.asMember(guild.id)
            val missing = command.userPermissions.values.filter {
                member.getPermissions().contains(it)
            }

            if (missing.isNotEmpty()) {
                val perms = missing.map { perm -> perm::class.jvmName }
                message.reply("You are missing the following permissions: ${perms.joinToString(", ")}")

                return
            }
        }

        // check the permissions for Nino
        if (command.botPermissions.values.isNotEmpty()) {
            val missing = command.botPermissions.values.filter {
                self.getPermissions().contains(it)
            }

            if (missing.isNotEmpty()) {
                val perms = missing.map { perm -> perm::class.jvmName }
                message.reply("I am missing the following permissions: ${perms.joinToString(", ")}")

                return
            }
        }

        // Figure out the subcommand, if any.
        var subcommand: Subcommand? = null
        for (arg in args) {
            if (command.thisCtx.subcommands.isNotEmpty()) {
                if (command.thisCtx.subcommands.find { it.name == arg || it.aliases.contains(arg) } != null) {
                    subcommand = command.thisCtx.subcommands.first { it.name == arg || it.aliases.contains(arg) }
                    break
                }
            }
        }

        val watch = StopWatch()
        val timer = prometheus.commandLatency?.labels(command.name)?.startTimer()

        watch.start()
        if (subcommand != null) {
            val newCtx = CommandMessage(
                event,
                args.drop(1),
                guildEntity,
                userEntity,
                locale
            )

            subcommand.execute(newCtx) { ex, success ->
                prometheus.commandsExecuted?.inc()
                prometheus.commandLatency?.observe(timer!!.observeDuration())

                watch.stop()

                logger.info("Subcommand \"$prefix${command.name} ${subcommand.name}\" was executed by ${event.message.author!!.tag} in guild ${guild.name} (${guild.id.asString})")
                onCommandResult(newCtx, subcommand.name, ex, success, true)
            }
        } else {
            command.execute(message) { ex, success ->
                prometheus.commandsExecuted?.inc()
                prometheus.commandLatency?.observe(timer!!.observeDuration())

                watch.stop()

                logger.info("Command \"$prefix${command.name}\" was executed by ${event.message.author!!.tag} in guild ${guild.name} (${guild.id.asString})")
                onCommandResult(message, name, ex, success)
            }
        }
    }

    private suspend fun onCommandResult(
        message: CommandMessage,
        name: String,
        ex: Exception?,
        success: Boolean,
        isSub: Boolean = false
    ) {
        // Don't do anything if it was successful.
        if (success) return

        // Report to Sentry, if we can
        if (config.sentryDsn != null) {
            Sentry.captureException(ex as Throwable)
        }

        // Fetch the owners
        val owners = config.owners.map {
            val user = NinoScope.future { kord.getUser(it.asSnowflake()) }.join() ?: User(
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
            val stream = PrintStream(baos, true, StandardCharsets.UTF_8.name())
            stream.use { ex!!.printStackTrace(stream) }

            val stacktrace = baos.toString(StandardCharsets.UTF_8.name())
            message.reply(
                buildString {
                    appendLine("I was unable to execute the **$name** ${if (isSub) "sub" else ""}command. If this is a re-occurrence, please report it to:")
                    appendLine(owners.joinToString(", ") { "**$it**" })
                    appendLine()
                    appendLine("Since you're in development mode, I will send the stacktrace here and in the console.")
                    appendLine()
                    appendLine("```kotlin")
                    appendLine(stacktrace.elipsis(1500))
                    appendLine("```")
                }
            )
        } else {
            message.reply(
                buildString {
                    appendLine("I was unable to execute the **$name** ${if (isSub) "sub" else ""}command. If this a re-occurrence, please report it to:")
                    appendLine(owners.joinToString(", ") { "**$it**" })
                    appendLine("and report it to the Noelware server under <#824071651486335036>: https://discord.gg/ATmjFH9kMH")
                }
            )
        }

        Sentry.captureException(ex as Throwable)
        logger.error("Unable to execute command $name:", ex)
    }
}
