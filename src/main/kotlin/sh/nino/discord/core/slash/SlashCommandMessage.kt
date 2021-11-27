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

import dev.kord.common.entity.AllowedMentions
import dev.kord.common.entity.CommandArgument
import dev.kord.common.entity.MessageFlag
import dev.kord.common.entity.MessageFlags
import dev.kord.common.entity.optional.Optional
import dev.kord.common.entity.optional.OptionalBoolean
import dev.kord.core.Kord
import dev.kord.core.entity.Guild
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.TextChannel
import dev.kord.core.event.interaction.InteractionCreateEvent
import dev.kord.rest.builder.message.EmbedBuilder
import dev.kord.rest.json.request.FollowupMessageCreateRequest
import dev.kord.rest.json.request.MultipartFollowupMessageCreateRequest
import sh.nino.discord.core.database.tables.GuildEntity
import sh.nino.discord.core.database.tables.UserEntity
import sh.nino.discord.modules.localization.Locale
import sh.nino.discord.utils.Constants

class SlashCommandMessage(
    private val event: InteractionCreateEvent,
    private val kord: Kord,
    val userSettings: UserEntity,
    val settings: GuildEntity,
    val channel: TextChannel,
    val options: Map<String, CommandArgument<*>?>,
    val locale: Locale,
    val author: User,
    val guild: Guild
) {
    suspend fun reply(content: String, embed: EmbedBuilder.() -> Unit) {
        val builder = EmbedBuilder().apply(embed)
        builder.color = Constants.COLOR

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
        builder.color = Constants.COLOR

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
