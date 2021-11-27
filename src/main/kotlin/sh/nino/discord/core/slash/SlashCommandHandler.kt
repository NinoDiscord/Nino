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

import dev.kord.common.entity.ApplicationCommandOptionType
import dev.kord.common.entity.InteractionResponseType
import dev.kord.common.entity.InteractionType
import dev.kord.common.entity.Snowflake
import dev.kord.common.entity.optional.optional
import dev.kord.core.Kord
import dev.kord.core.entity.interaction.ApplicationCommandInteraction
import dev.kord.core.event.interaction.InteractionCreateEvent
import dev.kord.rest.builder.interaction.*
import dev.kord.rest.json.request.InteractionApplicationCommandCallbackData
import dev.kord.rest.json.request.InteractionResponseCreateRequest
import kotlinx.coroutines.launch
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.koin.core.context.GlobalContext
import sh.nino.discord.core.NinoScope
import sh.nino.discord.core.database.tables.GuildEntity
import sh.nino.discord.core.database.tables.Guilds
import sh.nino.discord.core.database.tables.UserEntity
import sh.nino.discord.core.database.tables.Users
import sh.nino.discord.core.database.transactions.asyncTransaction
import sh.nino.discord.core.slash.builders.ApplicationCommandOption
import sh.nino.discord.extensions.asSnowflake
import sh.nino.discord.kotlin.logging
import sh.nino.discord.modules.localization.LocalizationModule
import sh.nino.discord.modules.prometheus.PrometheusModule
import java.lang.IllegalStateException

class SlashCommandHandler(
    private val prometheus: PrometheusModule,
    private val kord: Kord,
    private val localization: LocalizationModule
) {
    private val logger by logging<SlashCommandHandler>()
    val commands: List<SlashCommand> = GlobalContext
        .get()
        .getAll()

    init {
        logger.info("Registering slash commands...")
        NinoScope.launch {
            for (command in commands) {
                if (command.onlyIn.isNotEmpty()) {
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
        val guild = kord.rest.guild.getGuild(event.interaction.data.guildId.value!!)
        val channel = kord.rest.channel.getChannel(event.interaction.data.channelId.value.asSnowflake())

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
    }
}
