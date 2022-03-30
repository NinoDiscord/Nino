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

package sh.nino.discord.slash.commands

import dev.kord.common.entity.AllowedMentions
import dev.kord.common.entity.InteractionResponseType
import dev.kord.common.entity.MessageFlag
import dev.kord.common.entity.MessageFlags
import dev.kord.common.entity.optional.Optional
import dev.kord.common.entity.optional.OptionalBoolean
import dev.kord.common.entity.optional.optional
import dev.kord.core.Kord
import dev.kord.core.entity.Guild
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.TextChannel
import dev.kord.core.event.interaction.InteractionCreateEvent
import dev.kord.rest.builder.message.EmbedBuilder
import dev.kord.rest.json.request.FollowupMessageCreateRequest
import dev.kord.rest.json.request.InteractionApplicationCommandCallbackData
import dev.kord.rest.json.request.InteractionResponseCreateRequest
import dev.kord.rest.json.request.MultipartFollowupMessageCreateRequest
import sh.nino.discord.common.COLOR
import sh.nino.discord.core.localization.Locale
import sh.nino.discord.core.messaging.PaginationEmbed
import sh.nino.discord.database.tables.GuildSettingsEntity
import sh.nino.discord.database.tables.UserEntity
import java.lang.IllegalArgumentException

class SlashCommandArguments(private val args: Map<CommandOption<*>, Any>) {
    operator fun <T> get(key: CommandOption<*>): T {
        if (!args.containsKey(key) || key.type is CommandOptionType.Nullable)
            throw IllegalArgumentException("Missing key in args: ${key.name} or is null.")

        return args[key] as T
    }

    fun <T> getNull(key: CommandOption<*>): T? {
        if (!args.containsKey(key))
            return null

        return args[key] as T
    }
}

class SlashCommandMessage(
    private val event: InteractionCreateEvent,
    private val kord: Kord,
    val args: SlashCommandArguments,
    val settings: GuildSettingsEntity,
    val userSettings: UserEntity,
    val locale: Locale,
    val author: User,
    val guild: Guild
) {
    /**
     * Creates a new [PaginationEmbed] for showing off more than one embed to the user.
     * @param embeds A list of embeds to show.
     */
    suspend fun createPaginationEmbed(embeds: List<EmbedBuilder>): PaginationEmbed {
        val channel = event.interaction.channel.asChannel() as TextChannel
        return PaginationEmbed(channel, author, embeds)
    }

    suspend fun defer() {
        kord.rest.interaction.createInteractionResponse(
            event.interaction.id, event.interaction.token,
            InteractionResponseCreateRequest(
                InteractionResponseType.ChannelMessageWithSource,
                InteractionApplicationCommandCallbackData().optional()
            )
        )
    }

    suspend fun deferEphermerally() {
        kord.rest.interaction.createInteractionResponse(
            event.interaction.id, event.interaction.token,
            InteractionResponseCreateRequest(
                InteractionResponseType.ChannelMessageWithSource,
                InteractionApplicationCommandCallbackData(
                    flags = Optional.invoke(
                        MessageFlags {
                            +MessageFlag.Ephemeral
                        }
                    )
                ).optional()
            )
        )
    }

    suspend fun reply(content: String, embed: EmbedBuilder.() -> Unit) {
        val builder = EmbedBuilder().apply(embed)
        builder.color = COLOR

        kord.rest.interaction.createFollowupMessage(
            kord.selfId, event.interaction.token,
            MultipartFollowupMessageCreateRequest(
                FollowupMessageCreateRequest(
                    content = Optional.invoke(content),
                    embeds = Optional.invoke(listOf(builder.toRequest()))
                )
            )
        )
    }

    suspend fun reply(embed: EmbedBuilder.() -> Unit) {
        val builder = EmbedBuilder().apply(embed)
        builder.color = COLOR

        kord.rest.interaction.createFollowupMessage(
            kord.selfId, event.interaction.token,
            MultipartFollowupMessageCreateRequest(
                FollowupMessageCreateRequest(
                    embeds = Optional.invoke(listOf(builder.toRequest()))
                )
            )
        )
    }

    suspend fun reply(content: String, ephemeral: Boolean = false) {
        kord.rest.interaction.createFollowupMessage(
            kord.selfId, event.interaction.token,
            MultipartFollowupMessageCreateRequest(
                FollowupMessageCreateRequest(
                    content = Optional.invoke(content),
                    flags = if (ephemeral) Optional.invoke(
                        MessageFlags {
                            +MessageFlag.Ephemeral
                        }
                    ) else Optional.Missing(),
                    allowedMentions = Optional.invoke(
                        AllowedMentions(
                            listOf(),
                            listOf(),
                            listOf(),
                            OptionalBoolean.Value(false)
                        )
                    )
                )
            )
        )
    }
}
