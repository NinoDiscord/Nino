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

package sh.nino.discord.commands.components

import dev.kord.common.entity.ButtonStyle
import dev.kord.common.entity.ComponentType
import dev.kord.common.entity.DiscordPartialEmoji
import dev.kord.common.entity.InteractionType
import dev.kord.core.Kord
import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.behavior.edit
import dev.kord.core.entity.Message
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.TextChannel
import dev.kord.core.event.interaction.ComponentInteractionCreateEvent
import dev.kord.core.event.interaction.InteractionCreateEvent
import dev.kord.core.on
import dev.kord.rest.builder.message.EmbedBuilder
import dev.kord.rest.builder.message.create.actionRow
import dev.kord.rest.builder.message.modify.actionRow
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import sh.nino.commons.RandomId
import sh.nino.commons.extensions.inject
import sh.nino.discord.commands.CommandMessage

/**
 * Extension method for [CommandMessage] to create a new [ButtonPaginationEmbed] without
 * calling the constructor method of [ButtonPaginationEmbed] and invoking the [run method][ButtonPaginationEmbed.run]
 */
suspend fun CommandMessage.createButtonEmbed(embeds: List<EmbedBuilder>) {
    val embed = ButtonPaginationEmbed(null as TextChannel, null as User, embeds)
    return embed.run()
}

/**
 * Represents a paginated embed with using the Buttons component. Since with new instance
 * of [ButtonPaginationEmbed], a random ID is generated to identify the embed, so please,
 * create a new one when you need it; do not re-use this one.
 */
class ButtonPaginationEmbed(
    private val channel: TextChannel,
    private val invoker: User,
    private var embeds: List<EmbedBuilder>,
) {
    companion object {
        val REACTIONS = mapOf(
            "stop" to "\u23F9\uFE0F",
            "right" to "\u27A1\uFE0F",
            "left" to "\u2B05\uFE0F",
            "first" to "\u23EE\uFE0F",
            "last" to "\u23ED\uFE0F"
        )
    }

    private val kord: Kord by inject()
    private var index = 0
    private val uniqueId = RandomId.generate(4)
    private lateinit var job: Job
    private lateinit var message: Message
    private val listening: Boolean
        get() = if (!this::job.isInitialized) false else this.job.isActive

    suspend fun close() {
        // nop this
        if (!listening) return

        message.delete("[Paginated Embed for ${invoker.tag}] Embed was destroyed by request.")
        job.cancelAndJoin()
    }

    suspend fun run() {
        if (this::job.isInitialized) throw IllegalStateException("Embed is already running")

        val self = this // used for \/
        message = channel.createMessage {
            embeds += self.embeds[index].apply {
                footer {
                    text = "Page ${index + 1}/${self.embeds.size}"
                }
            }

            actionRow {
                // Since when the embed is constructed, `disabled` for the first button
                // is always disabled, but it will be enabled if needed.
                interactionButton(ButtonStyle.Secondary, "nino:pagination:$uniqueId:first") {
                    emoji = DiscordPartialEmoji(id = null, REACTIONS["first"]!!)
                    disabled = true
                }

                interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:left") {
                    emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                }

                interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:stop") {
                    emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                }

                interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:right") {
                    emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                }

                interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:last") {
                    emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                    disabled = index >= self.embeds.size
                }
            }
        }

        job = kord.on<InteractionCreateEvent> {
            onInteractionReceive(this)
        }
    }

    private suspend fun onInteractionReceive(event: InteractionCreateEvent) {
        // Do not do anything if the interaction type is NOT a Component.
        if (event.interaction.type != InteractionType.Component) return

        // cast it at compile time
        event as ComponentInteractionCreateEvent

        // Is it a button? If not, let's skip it!
        if (event.interaction.componentType != ComponentType.Button) return

        // Do not run any actions if it doesn't start with `nino:selection:$uniqueId`.
        if (!event.interaction.componentId.startsWith("nino:selection:$uniqueId")) return

        // Is the member who clicked the button the same as the one who invoked it?
        if (event.interaction.data.member.value != null && event.interaction.data.member.value!!.userId != invoker.id) return

        // Acknowledge that we plan to update the message
        event.interaction.deferPublicMessageUpdate()

        val self = this

        // Get the action to use
        when (event.interaction.componentId.split(":").last()) {
            "stop" -> close()
            "left" -> {
                index -= 1
                if (index < 0) index = embeds.size - 1

                message.edit {
                    embeds?.plusAssign(
                        self.embeds[index].apply {
                            footer {
                                text = "Page ${index + 1}/${self.embeds.size}"
                            }
                        }
                    )

                    actionRow {
                        // Since when the embed is constructed, `disabled` for the first button
                        // is always disabled, but it will be enabled if needed.
                        interactionButton(ButtonStyle.Secondary, "nino:pagination:$uniqueId:first") {
                            emoji = DiscordPartialEmoji(id = null, REACTIONS["first"]!!)
                            disabled = index == 0
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:left") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:stop") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:right") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:last") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                            disabled = index >= self.embeds.size
                        }
                    }
                }
            }

            "right" -> {
                index++
                if (index == embeds.size) index = 0

                message.edit {
                    embeds?.plusAssign(
                        self.embeds[index].apply {
                            footer {
                                text = "Page ${index + 1}/${self.embeds.size}"
                            }
                        }
                    )

                    actionRow {
                        // Since when the embed is constructed, `disabled` for the first button
                        // is always disabled, but it will be enabled if needed.
                        interactionButton(ButtonStyle.Secondary, "nino:pagination:$uniqueId:first") {
                            emoji = DiscordPartialEmoji(id = null, REACTIONS["first"]!!)
                            disabled = index == 0
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:left") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:stop") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:right") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:last") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                            disabled = index >= self.embeds.size
                        }
                    }
                }
            }

            "first" -> {
                // We shouldn't be able to press this (since it's guarded when we use the `run` method)
                // but this is just a safety guard just in case we need it.
                if (index == 0) return

                index = 0
                message.edit {
                    embeds?.plusAssign(
                        self.embeds[index].apply {
                            footer {
                                text = "Page ${index + 1}/${self.embeds.size}"
                            }
                        }
                    )

                    actionRow {
                        // Since when the embed is constructed, `disabled` for the first button
                        // is always disabled, but it will be enabled if needed.
                        interactionButton(ButtonStyle.Secondary, "nino:pagination:$uniqueId:first") {
                            emoji = DiscordPartialEmoji(id = null, REACTIONS["first"]!!)
                            disabled = true
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:left") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:stop") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:right") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:last") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                            disabled = index >= self.embeds.size
                        }
                    }
                }
            }

            "last" -> {
                val lastIndex = embeds.size - 1
                if (index == lastIndex) return

                index = lastIndex
                message.edit {
                    embeds?.plusAssign(
                        self.embeds[index].apply {
                            footer {
                                text = "Page ${index + 1}/${self.embeds.size}"
                            }
                        }
                    )

                    actionRow {
                        // Since when the embed is constructed, `disabled` for the first button
                        // is always disabled, but it will be enabled if needed.
                        interactionButton(ButtonStyle.Secondary, "nino:pagination:$uniqueId:first") {
                            emoji = DiscordPartialEmoji(id = null, REACTIONS["first"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:left") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:stop") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:right") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:last") {
                            emoji = DiscordPartialEmoji(id = null, name = REACTIONS["left"]!!)
                            disabled = true
                        }
                    }
                }
            }
        }
    }
}
