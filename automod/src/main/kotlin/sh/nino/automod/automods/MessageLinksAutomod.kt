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

package sh.nino.automod.automods

import dev.kord.common.Color
import dev.kord.common.entity.ChannelType
import dev.kord.common.entity.optional.value
import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.entity.Message
import dev.kord.core.entity.channel.NewsChannel
import dev.kord.core.entity.channel.TextChannel
import dev.kord.rest.builder.message.EmbedBuilder
import dev.kord.rest.builder.message.create.allowedMentions
import kotlinx.datetime.Instant
import sh.nino.automod.automod
import sh.nino.commons.Constants
import sh.nino.commons.extensions.asSnowflake

private val DISCORD_MESSAGE_LINK_REGEX = "(?:https?:\\/\\/)?(?:canary\\.|ptb\\.)?discord\\.com\\/channels\\/(\\d{15,21}|@me)\\/(\\d{15,21})\\/(\\d{15,21})\n".toRegex()

val MessageLinksAutomod = automod {
    name = "message_links"
    onMessage { event ->
        // If the message doesn't include the thing, let's just not do anything
        if (!event.message.content.matches(DISCORD_MESSAGE_LINK_REGEX)) return@onMessage false

        val matcher = DISCORD_MESSAGE_LINK_REGEX.toPattern().matcher(event.message.content)
        if (!matcher.matches()) return@onMessage false

        val channelId = matcher.group(4).asSnowflake()
        val messageId = matcher.group(5).asSnowflake()
        val channel = event.kord.getChannel(channelId) ?: return@onMessage false

        val message: Message = when (channel.type) {
            is ChannelType.GuildText -> {
                try {
                    (channel as TextChannel).getMessage(messageId)
                } catch (e: Exception) {
                    null
                }
            }

            is ChannelType.GuildNews -> {
                try {
                    (channel as NewsChannel).getMessage(messageId)
                } catch (e: Exception) {
                    null
                }
            }

            else -> null
        } ?: return@onMessage false

        if (message.embeds.isNotEmpty()) {
            val first = message.embeds.first()
            val member = message.getAuthorAsMember()

            event.message.channel.createMessage {
                if (message.content.isNotEmpty()) {
                    content = message.content
                }

                allowedMentions {
                    repliedUser = false
                }

                embeds += EmbedBuilder().apply {
                    if (first.data.title.value != null) {
                        title = first.data.title.value
                    }

                    if (first.data.description.value != null) {
                        description = first.data.description.value
                    }

                    if (first.data.url.value != null) {
                        url = first.data.url.value
                    }

                    color = if (first.data.color.asNullable != null) {
                        Color(first.data.color.asOptional.value!!)
                    } else {
                        Constants.COLOR
                    }

                    if (first.data.timestamp.value != null) {
                        timestamp = Instant.parse(first.data.timestamp.value!!)
                    }

                    if (first.data.footer.value != null) {
                        footer {
                            text = first.data.footer.value!!.text
                            icon = first.data.footer.value!!.iconUrl.value ?: first.data.footer.value!!.proxyIconUrl.value ?: ""
                        }
                    }

                    if (first.data.thumbnail.value != null) {
                        thumbnail {
                            url = first.data.thumbnail.value!!.url.value ?: first.data.thumbnail.value!!.proxyUrl.value ?: ""
                        }
                    }

                    if (first.data.author.value != null) {
                        author {
                            name = first.data.author.value!!.name.value ?: ""
                            icon = first.data.author.value!!.iconUrl.value ?: first.data.author.value!!.proxyIconUrl.value ?: ""
                            url = first.data.author.value!!.url.value ?: ""
                        }
                    } else {
                        author {
                            name = if (message.author == null) {
                                "Webhook"
                            } else {
                                "${message.author!!.tag} (${message.author!!.id})"
                            }

                            icon = member?.avatar?.url ?: message.author!!.avatar?.url ?: message.author!!.defaultAvatar.url
                        }
                    }

                    if (first.data.fields.value != null) {
                        for (f in first.data.fields.value!!) {
                            field {
                                name = f.name
                                value = f.value
                                inline = f.inline.value ?: true
                            }
                        }
                    }
                }
            }

            true
        } else {
            val member = message.getAuthorAsMember()
            event.message.channel.createMessage {
                embeds += EmbedBuilder().apply {
                    description = message.content
                    color = Constants.COLOR

                    author {
                        name = if (message.author == null) "Webhook" else "${message.author!!.tag} (${message.author!!.id})"

                        if (message.author != null) {
                            icon = member?.avatar?.url ?: message.author!!.avatar?.url ?: message.author!!.defaultAvatar.url
                        }
                    }
                }
            }

            true
        }
    }
}
