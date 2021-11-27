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

package sh.nino.discord.core.slash

import dev.kord.common.annotation.KordExperimental
import dev.kord.common.annotation.KordUnsafe
import dev.kord.common.entity.*
import dev.kord.common.entity.optional.Optional
import dev.kord.common.entity.optional.optional
import dev.kord.core.Kord
import dev.kord.core.cache.data.UserData
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.TextChannel
import dev.kord.core.entity.interaction.ApplicationCommandInteraction
import dev.kord.core.event.interaction.InteractionCreateEvent
import dev.kord.rest.builder.interaction.*
import dev.kord.rest.json.request.FollowupMessageCreateRequest
import dev.kord.rest.json.request.InteractionApplicationCommandCallbackData
import dev.kord.rest.json.request.InteractionResponseCreateRequest
import dev.kord.rest.json.request.MultipartFollowupMessageCreateRequest
import io.sentry.Sentry
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.future.await
import kotlinx.coroutines.future.future
import kotlinx.coroutines.launch
import org.koin.core.context.GlobalContext
import sh.nino.discord.core.NinoScope
import sh.nino.discord.core.database.tables.GuildEntity
import sh.nino.discord.core.database.tables.Guilds
import sh.nino.discord.core.database.tables.UserEntity
import sh.nino.discord.core.database.tables.Users
import sh.nino.discord.core.database.transactions.asyncTransaction
import sh.nino.discord.core.slash.builders.ApplicationCommandOption
import sh.nino.discord.data.Config
import sh.nino.discord.data.Environment
import sh.nino.discord.extensions.asSnowflake
import sh.nino.discord.kotlin.logging
import sh.nino.discord.modules.localization.LocalizationModule
import java.io.ByteArrayOutputStream
import java.io.PrintStream
import java.lang.IllegalStateException
import java.nio.charset.StandardCharsets
import kotlin.reflect.jvm.jvmName

class SlashCommandHandler(
    private val kord: Kord,
    private val localization: LocalizationModule,
    private val config: Config
) {
    private val logger by logging<SlashCommandHandler>()
    val commands: List<SlashCommand> = GlobalContext
        .get()
        .getAll()

    init {
        logger.info("Registering slash commands...")
        NinoScope.launch {
            for (command in commands) {
                if (command.onlyIn.isEmpty()) {
                    registerSlashCommand(command)
                } else {
                    registerGuildSlashCommand(command)
                }
            }
        }
    }

    private fun SubCommandBuilder.fillInInnerOptions(option: ApplicationCommandOption) {
        when (option.type) {
            ApplicationCommandOptionType.Integer -> {
                int(option.name, option.description) {
                    this.required = option.required
                    if (option.choices != null) {
                        for (choice in option.choices) choice(choice.name, choice.value as Long)
                    }
                }
            }

            ApplicationCommandOptionType.Number -> {
                number(option.name, option.description) {
                    this.required = option.required
                    if (option.choices != null) {
                        for (choice in option.choices) choice(choice.name, choice.value as Double)
                    }
                }
            }

            ApplicationCommandOptionType.String -> {
                string(option.name, option.description) {
                    this.required = option.required
                    if (option.choices != null) {
                        for (choice in option.choices) choice(choice.name, choice.value as String)
                    }
                }
            }

            ApplicationCommandOptionType.Boolean -> {
                boolean(option.name, option.description) {
                    this.required = option.required
                }
            }

            ApplicationCommandOptionType.Role -> {
                role(option.name, option.description) {
                    this.required = option.required
                }
            }

            ApplicationCommandOptionType.User -> {
                user(option.name, option.description) {
                    this.required = option.required
                }
            }

            ApplicationCommandOptionType.Channel -> {
                channel(option.name, option.description) {
                    this.required = option.required
                }
            }

            else -> error("Option type ${option.type.type} is not available under subcommands.")
        }
    }

    private fun GroupCommandBuilder.fillInInnerOptions(option: ApplicationCommandOption) {
        if (option.options == null) throw IllegalStateException("Missing `options` object. Did you add the `option {}` DSL object?")

        subCommand(option.name, option.description) {
            this.required = option.required
            for (inner in option.options) {
                fillInInnerOptions(option)
            }
        }
    }

    private fun ChatInputCreateBuilder.fillInOptions(option: ApplicationCommandOption) {
        when (option.type) {
            ApplicationCommandOptionType.Integer -> {
                int(option.name, option.description) {
                    this.required = option.required
                    if (option.choices != null) {
                        for (choice in option.choices) choice(choice.name, choice.value as Long)
                    }
                }
            }

            ApplicationCommandOptionType.Number -> {
                number(option.name, option.description) {
                    this.required = option.required
                    if (option.choices != null) {
                        for (choice in option.choices) choice(choice.name, choice.value as Double)
                    }
                }
            }

            ApplicationCommandOptionType.String -> {
                string(option.name, option.description) {
                    this.required = option.required
                    if (option.choices != null) {
                        for (choice in option.choices) choice(choice.name, choice.value as String)
                    }
                }
            }

            ApplicationCommandOptionType.Boolean -> {
                boolean(option.name, option.description) {
                    this.required = option.required
                }
            }

            ApplicationCommandOptionType.Role -> {
                role(option.name, option.description) {
                    this.required = option.required
                }
            }

            ApplicationCommandOptionType.User -> {
                user(option.name, option.description) {
                    this.required = option.required
                }
            }

            ApplicationCommandOptionType.Channel -> {
                channel(option.name, option.description) {
                    this.required = option.required
                }
            }

            ApplicationCommandOptionType.Mentionable -> {
                mentionable(option.name, option.description) {
                    this.required = option.required
                }
            }

            ApplicationCommandOptionType.SubCommand -> {
                if (option.options == null) throw IllegalStateException("Missing `options` object. Did you add the `option {}` DSL object?")

                subCommand(option.name, option.description) {
                    this.required = option.required
                    for (inner in option.options) {
                        fillInInnerOptions(option)
                    }
                }
            }

            ApplicationCommandOptionType.SubCommandGroup -> {
                if (option.options == null) throw IllegalStateException("Missing `options` object. Did you add the `option {}` DSL object?")

                group(option.name, option.description) {
                    this.required = option.required
                    for (inner in option.options.filter { it.type == ApplicationCommandOptionType.SubCommand }) {
                        fillInInnerOptions(option)
                    }
                }
            }

            else -> error("Unknown option: ${option.type}")
        }
    }

    private suspend fun registerSlashCommand(command: SlashCommand) {
        logger.info("-+ /${command.name} ~ ${command.description}")
        kord.createGlobalChatInputCommand(command.name, command.description) {
            for (option in command.options) {
                fillInOptions(option)
            }
        }
    }

    private suspend fun registerGuildSlashCommand(command: SlashCommand) {
        logger.info("-+ /${command.name} ~ ${command.description} (Guilds: ${command.onlyIn.joinToString(", ")})")
        for (guild in command.onlyIn) {
            kord.createGuildChatInputCommand(Snowflake(guild), command.name, command.description) {
                defaultPermission = true

                for (option in command.options) {
                    fillInOptions(option)
                }
            }
        }
    }

    @OptIn(KordUnsafe::class, KordExperimental::class)
    suspend fun onInteraction(event: InteractionCreateEvent) {
        // If it is not an application command, skip it.
        if (event.interaction.type != InteractionType.ApplicationCommand) return
        event.interaction as ApplicationCommandInteraction // cast it at compile time

        // Check if it is from a DM channel, since we do not
        // invoke slash commands there!
        if (event.interaction.data.guildId.value == null) return

        // Why don't we check if it's a webhook or bot if it does
        // in the text command handler?
        //
        // Bots and webhooks cannot invoke slash commands, so it's
        // pretty redundant to.
        val author = event.interaction.user.asUser()
        val guild = kord.unsafe.guild(event.interaction.data.guildId.value!!)
        val channel = kord.unsafe.channel(event.interaction.data.channelId.value.asSnowflake()).asChannel()

        // Now we get guild and user settings
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

        // Find the slash command we need to execute
        val name = event.interaction.data.data.name.value!!
        val command = commands.find {
            it.name == name
        } ?: return // If we can't find the command, just not do anything lol.

        // Create an interaction response, this will notify the user
        // that we are trying to execute the command...
        kord.rest.interaction.createInteractionResponse(
            event.interaction.id, event.interaction.token,
            InteractionResponseCreateRequest(
                InteractionResponseType.DeferredChannelMessageWithSource,
                InteractionApplicationCommandCallbackData().optional()
            )
        )

        // Collect all options
        val options = mutableMapOf<String, CommandArgument<*>?>()
        if (event.interaction.data.data.options.value != null) {
            for (option in event.interaction.data.data.options.value!!) {
                options[option.name] = option.value.value
            }
        }

        // Check if the executor has permission to execute this slash command.
        // This inherits for all subcommands/subcommand groups
        if (command.userPermissions.values.isNotEmpty() && guild.asGuild().ownerId != author.id) {
            val member = author.asMember(guild.id)
            val missing = command.userPermissions.values.filter {
                !member.getPermissions().contains(it)
            }

            if (missing.isNotEmpty()) {
                val perms = missing.map { perm -> perm::class.jvmName.split("$").last() }
                kord.rest.interaction.createFollowupMessage(
                    kord.selfId,
                    event.interaction.token,
                    MultipartFollowupMessageCreateRequest(
                        FollowupMessageCreateRequest(
                            content = Optional.invoke("You are missing the following permissions: $perms.")
                        )
                    )
                )

                return
            }
        }

        if (command.botPermissions.values.isNotEmpty()) {
            val self = guild.members.firstOrNull { it.id.asString == kord.selfId.asString } ?: return
            val missing = command.botPermissions.values.filter {
                !self.getPermissions().contains(it)
            }

            if (missing.isNotEmpty()) {
                val perms = missing.map { perm -> perm::class.jvmName.split("$").last() }
                kord.rest.interaction.createFollowupMessage(
                    kord.selfId,
                    event.interaction.token,
                    MultipartFollowupMessageCreateRequest(
                        FollowupMessageCreateRequest(
                            content = Optional.invoke("I am missing the following permissions: $perms.")
                        )
                    )
                )

                return
            }
        }

        val message = SlashCommandMessage(
            event,
            kord,
            userEntity,
            guildEntity,
            channel as TextChannel,
            options,
            localization.get(guildEntity.language, userEntity.language),
            author,
            guild.asGuild()
        )

        // Now, we execute the command! ^w^
        NinoScope.launch {
            command.execute(message) { exception, success ->
                if (!success) {
                    // Report to Sentry, if we can
                    if (config.sentryDsn != null) {
                        Sentry.captureException(exception as Throwable)
                    }

                    // Fetch the owners
                    val owners = config.owners.map {
                        val user = NinoScope.future { kord.getUser(it.asSnowflake()) }.await() ?: User(
                            UserData.from(
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
                        stream.use { exception!!.printStackTrace(stream) }

                        val stacktrace = baos.toString(StandardCharsets.UTF_8.name())
//                        message.reply(
//                            buildString {
//                                appendLine("I was unable to execute the **$name** ${if (isSub) "sub" else ""}command. If this is a re-occurrence, please report it to:")
//                                appendLine(owners.joinToString(", ") { "**$it**" })
//                                appendLine()
//                                appendLine("Since you're in development mode, I will send the stacktrace here and in the console.")
//                                appendLine()
//                                appendLine("```kotlin")
//                                appendLine(stacktrace.elipsis(1500))
//                                appendLine("```")
//                            }
//                        )
                    } else {
//                        message.reply(
//                            buildString {
//                                appendLine("I was unable to execute the **$name** ${if (isSub) "sub" else ""}command. If this a re-occurrence, please report it to:")
//                                appendLine(owners.joinToString(", ") { "**$it**" })
//                                appendLine("and report it to the Noelware server under <#824071651486335036>: https://discord.gg/ATmjFH9kMH")
//                            }
//                        )
                    }
                }
            }
        }
    }
}
