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

package sh.nino.discord.core.messaging

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
import org.koin.core.context.GlobalContext
import sh.nino.discord.core.SuspendClosable
import sh.nino.discord.extensions.inject
import java.util.*

/**
 * Represents an embed that can be paginated in a specific amount of time before
 * the underlying [Job][kotlinx.coroutines.Job] is closed off and no more events
 * will be coming in.
 */
class PaginationEmbed(
    private val channel: TextChannel,
    private val invoker: User,
    private var embeds: List<EmbedBuilder>,
): SuspendClosable {
    companion object {
        val REACTIONS = mapOf(
            "stop" to "\u23F9\uFE0F",
            "right" to "\u27A1\uFE0F",
            "left" to "\u2B05\uFE0F",
            "first" to "\u23EE\uFE0F",
            "last" to "\u23ED\uFE0F"
        )
    }

    private val uniqueId = UUID.randomUUID().toString()

    // If this [PaginationEmbed] is listening to events.
    private val listening: Boolean
        get() = if (!this::job.isInitialized) {
            false
        } else {
            this.job.isActive
        }

    // Returns the [Message] that this [PaginationEmbed] has control over.
    private lateinit var message: Message

    // Returns the current index in this [PaginationEmbed] tree.
    private var currentIndex = 0

    // Returns the coroutine job that this [PaginationEmbed] has control over.
    private lateinit var job: Job

    override suspend fun close() {
        if (!this.listening) throw IllegalStateException("This PaginationEmbed is already closed.")

        message.delete("[Pagination Embed for ${invoker.tag}] Embed was destroyed.")
        job.cancelAndJoin()
    }

    suspend fun create() {
        if (this::job.isInitialized) throw IllegalStateException("PaginationEmbed is already running")

        message = channel.createMessage {
            embeds += this@PaginationEmbed.embeds[currentIndex].apply {
                footer {
                    text = "Page ${currentIndex + 1}/${this@PaginationEmbed.embeds.size}"
                }
            }

            actionRow {
                interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:first") {
                    emoji = DiscordPartialEmoji(
                        id = null,
                        name = REACTIONS["first"]!!
                    )

                    disabled = currentIndex == 0
                }

                interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:left") {
                    emoji = DiscordPartialEmoji(
                        id = null,
                        name = REACTIONS["left"]!!
                    )
                }

                interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:stop") {
                    emoji = DiscordPartialEmoji(
                        id = null,
                        name = REACTIONS["stop"]!!
                    )
                }

                interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:right") {
                    emoji = DiscordPartialEmoji(
                        id = null,
                        name = REACTIONS["right"]!!
                    )
                }

                interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:last") {
                    emoji = DiscordPartialEmoji(
                        id = null,
                        name = REACTIONS["last"]!!
                    )

                    disabled = currentIndex == this@PaginationEmbed.embeds.size
                }
            }
        }

        val kord = GlobalContext.inject<Kord>()
        job = kord.on<InteractionCreateEvent> { onInteractionReceive(this) }
    }

    private suspend fun onInteractionReceive(event: InteractionCreateEvent) {
        // do not do anything if the interaction type is not a component
        if (event.interaction.type != InteractionType.Component) return
        event as ComponentInteractionCreateEvent // cast it at compile time

        // Is it a button? If not, skip it.
        if (event.interaction.componentType != ComponentType.Button) return

        // If the custom id doesn't start with `nino:selection:$uniqueId`, skip it.
        if (!event.interaction.componentId.startsWith("nino:selection:$uniqueId")) return

        // Is the interaction member the user who invoked it?
        // If not, do not do anything
        if (event.interaction.data.member.value != null && event.interaction.data.member.value!!.userId.asString != invoker.id.asString) return

        event.interaction.acknowledgePublicDeferredMessageUpdate()

        // Get the action to use
        when (event.interaction.componentId.split(":").last()) {
            "stop" -> close()
            "left" -> {
                currentIndex -= 1
                if (currentIndex < 0) currentIndex = embeds.size - 1

                message.edit {
                    this.embeds = mutableListOf(
                        this@PaginationEmbed.embeds[currentIndex].apply {
                            footer {
                                text = "Page ${currentIndex + 1}/${this@PaginationEmbed.embeds.size}"
                            }
                        }
                    )

                    actionRow {
                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:first") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["first"]!!
                            )

                            disabled = currentIndex == 0
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:left") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["left"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:stop") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["stop"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:right") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["right"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:last") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["last"]!!
                            )

                            disabled = currentIndex == this@PaginationEmbed.embeds.size
                        }
                    }
                }
            }

            "right" -> {
                currentIndex++
                if (currentIndex == embeds.size) currentIndex = 0

                message.edit {
                    this.embeds = mutableListOf(
                        this@PaginationEmbed.embeds[currentIndex].apply {
                            footer {
                                text = "Page ${currentIndex + 1}/${this@PaginationEmbed.embeds.size}"
                            }
                        }
                    )

                    actionRow {
                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:first") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["first"]!!
                            )

                            disabled = currentIndex == 0
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:left") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["left"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:stop") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["stop"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:right") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["right"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:last") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["last"]!!
                            )

                            disabled = currentIndex == this@PaginationEmbed.embeds.size
                        }
                    }
                }
            }

            "first" -> {
                // We shouldn't get this if the currentIndex is zero since,
                // it's automatically disabled if it is. But, this is just
                // here to be safe and discord decides to commit a fucking woeme
                if (currentIndex == 0) return

                currentIndex = 0
                message.edit {
                    this.embeds = mutableListOf(
                        this@PaginationEmbed.embeds[currentIndex].apply {
                            footer {
                                text = "Page ${currentIndex + 1}/${this@PaginationEmbed.embeds.size}"
                            }
                        }
                    )

                    actionRow {
                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:first") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["first"]!!
                            )

                            disabled = currentIndex == 0
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:left") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["left"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:stop") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["stop"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:right") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["right"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:last") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["last"]!!
                            )

                            disabled = currentIndex == this@PaginationEmbed.embeds.size
                        }
                    }
                }
            }

            "last" -> {
                // this is just here to be safe.
                val lastIndex = embeds.size - 1
                if (currentIndex == lastIndex) return

                currentIndex = lastIndex
                message.edit {
                    this.embeds = mutableListOf(
                        this@PaginationEmbed.embeds[currentIndex].apply {
                            footer {
                                text = "Page ${currentIndex + 1}/${this@PaginationEmbed.embeds.size}"
                            }
                        }
                    )

                    actionRow {
                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:first") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["first"]!!
                            )

                            disabled = currentIndex == 0
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:left") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["left"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:stop") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["stop"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:right") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["right"]!!
                            )
                        }

                        interactionButton(ButtonStyle.Secondary, "nino:selection:$uniqueId:last") {
                            emoji = DiscordPartialEmoji(
                                id = null,
                                name = REACTIONS["last"]!!
                            )

                            disabled = currentIndex == this@PaginationEmbed.embeds.size
                        }
                    }
                }
            }
        }
    }
}
