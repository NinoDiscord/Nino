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

import dev.kord.core.Kord
import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.rest.builder.message.EmbedBuilder
import kotlinx.coroutines.flow.firstOrNull
import org.jetbrains.exposed.sql.or
import org.koin.core.context.GlobalContext
import sh.nino.discord.core.automod.AutomodContainer
import sh.nino.discord.core.command.arguments.Arg
import sh.nino.discord.core.command.arguments.Argument
import sh.nino.discord.core.command.arguments.ArgumentReader
import sh.nino.discord.core.command.arguments.readers.IntArgumentReader
import sh.nino.discord.core.command.arguments.readers.StringArgumentReader
import sh.nino.discord.core.database.tables.*
import sh.nino.discord.core.database.transactions.asyncTransaction
import sh.nino.discord.data.Config
import sh.nino.discord.extensions.asSnowflake
import sh.nino.discord.extensions.filterNonEmptyStrings
import sh.nino.discord.kotlin.logging
import sh.nino.discord.modules.prometheus.PrometheusModule
import sh.nino.discord.utils.Constants
import java.util.regex.Pattern
import kotlin.reflect.KClass
import kotlin.reflect.KParameter
import kotlin.reflect.full.findAnnotation
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
    private val kord: Kord
) {
    private val parsers: Map<KClass<*>, ArgumentReader<*>> = mapOf(
        String::class to StringArgumentReader(),
        Int::class to IntArgumentReader()
    )

    private val commands: Map<String, Command>
        get() = GlobalContext
            .get()
            .getAll<AbstractCommand>()
            .map { it.info.name to Command(it) }
            .toMappedPair()

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
        val guildEntity = asyncTransaction {
            GuildEntity.find {
                Guilds.id eq guild.id.value.toLong()
            }.firstOrNull()
        }.execute()

        val userEntity = asyncTransaction {
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
        }

        // If we cannot find the user, let's create a new entry.
        if (userEntity == null) {
            asyncTransaction {
                UserEntity.new(author.id.value.toLong()) {
                    language = "en_US"
                    prefixes = arrayOf()
                }
            }.execute()
        }

        // now we find which prefix was invoked
        val self = guild.members.firstOrNull { it.id.asString == kord.selfId.asString } ?: return
        val mentionRegex = Pattern.compile("^<@!?${kord.selfId.asString}> ").toRegex()
        val wasMentioned = event.message.content.matches(mentionRegex)

        val prefixes = (config.prefixes + listOf(
            guildEntity!!.prefixes.toList(),
            userEntity!!.prefixes.toList(),
            if (wasMentioned) mentionRegex.toString() else ""
        ) as List<String>).filterNonEmptyStrings()

        // recursively find the prefix, if we can't find it
        val prefix = prefixes.firstOrNull { event.message.content.startsWith(it) } ?: return
        if (wasMentioned && !event.message.content.contains(" ")) return

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
        val message = CommandMessage(event)
        val command = commands[cmdName]
            ?: commands.values.firstOrNull { it.aliases.contains(name) }
            ?: return

        if (command.ownerOnly && config.owners.contains(author.id.asString)) {
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

        // now we do argument parsing, which is a bit h in the chat im ngl
        val runMethod = command.thisCtx::class.members.find { it.isSuspend && it.name == "run" } ?: return
        val runArgs = runMethod.parameters.drop(1)
        val finalArgs: MutableMap<KParameter, Any> = mutableMapOf()
        var failed = false

        for ((i, arg) in runArgs.withIndex()) {
            val info = arg.findAnnotation<Arg>()
            if (info == null) {
                logger.warn("Skipping argument ${arg.name} (param #${arg.index}) since it doesn't have an `@Arg` annotation.")
                continue
            }

            val argument = Argument(arg, info)
            val parser = parsers[argument.type] ?: run {
                message.reply("An unknown exception has occurred, please try again later. If you are the owner, please refer to the logs.")
                logger.error("Argument ${argument.name} (param #${arg.index})'s type ${argument.type.jvmName} is missing a parser.")

                null
            } ?: continue

            val result = parser.parse(args[i])
            if (result.isEmpty && !argument.optional) {
                failed = true
                message.reply("Argument **${arg.name}** was not provided when it was required.")

                break
            } else {
                finalArgs[arg] = result.get()
            }
        }

        if (failed) return

        command.execute(message, *finalArgs.values.toTypedArray()) { ex, success ->
            if (!success) {
                message.reply("Unable to run command **$name**.")

                logger.error("Unable to execute command $name:", ex)
                return@execute
            }
        }
    }
}
