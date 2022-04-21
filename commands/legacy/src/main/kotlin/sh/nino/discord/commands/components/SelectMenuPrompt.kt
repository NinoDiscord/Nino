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

import dev.kord.common.entity.ComponentType
import dev.kord.common.entity.DiscordPartialEmoji
import dev.kord.common.entity.InteractionType
import dev.kord.core.Kord
import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.entity.Message
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.TextChannel
import dev.kord.core.event.interaction.ComponentInteractionCreateEvent
import dev.kord.core.event.interaction.InteractionCreateEvent
import dev.kord.core.on
import dev.kord.rest.builder.message.create.MessageCreateBuilder
import dev.kord.rest.builder.message.create.UserMessageCreateBuilder
import dev.kord.rest.builder.message.create.actionRow
import kotlinx.coroutines.Job
import sh.nino.commons.RandomId
import sh.nino.commons.extensions.inject
import sh.nino.discord.commands.Command
import kotlin.reflect.KCallable

/**
 * Represents the prompt value for a [SelectMenuPrompt].
 * @param name The name of the select menu that is used.
 * @param description The description of the select menu that is constructed.
 */
data class SelectMenuPromptValue(
    val name: String,
    val description: String,
    val methodID: String,
    val emoji: DiscordPartialEmoji? = null
)

/**
 * A prompt for invoking select menus with the current [Command][sh.nino.discord.commands.Command].
 * @param command The command that created this prompt.
 * @param channel The channel that the select menu was executed in.
 * @param invoker The [User] who invoked this prompt.
 * @param values A list of values that was constructed.
 * @param methodsToInvoke A [Map] of method IDs -> [KCallable] that is represented on the command.
 */
class SelectMenuPrompt(
    private val command: Command,
    private val channel: TextChannel,
    private val invoker: User,
    private val values: List<SelectMenuPromptValue>,
    private val methodsToInvoke: Map<String, KCallable<*>>
) {
    private lateinit var message: Message
    private lateinit var job: Job
    private val uniqueId = RandomId.generate(4)
    private val kord: Kord by inject()

    private val listening: Boolean
        get() = if (!this::job.isInitialized) false else job.isActive

    suspend fun execute(builder: UserMessageCreateBuilder.() -> Unit) {
        val data = UserMessageCreateBuilder().apply(builder)
        message = channel.createMessage {
            if (data.content != null) {
                content = data.content
            }

            if (data.embeds.isNotEmpty()) {
                embeds.plusAssign(data.embeds)
            }

            actionRow {
                selectMenu("nino:select:menu:$uniqueId") {
                    allowedValues = 1..25

                    for ((i, value) in values.withIndex()) {
                        option(value.name, "nino:select:menu:$uniqueId:${value.methodID}") {
                            if (value.emoji != null) emoji = value.emoji
                            default = i == 0
                        }
                    }
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
        if (event.interaction.componentType != ComponentType.SelectMenu) return

        // Is the member who clicked the button the same as the one who invoked it?
        if (event.interaction.data.member.value != null && event.interaction.data.member.value!!.userId != invoker.id) return

        // Check if the select menu ID is the same as this prompt
        if (event.interaction.data.data.customId.value != null && event.interaction.data.data.customId.value!! != "nino:select:menu:$uniqueId") return

        // Acknowledge that we plan to update the message
        event.interaction.deferPublicMessageUpdate()
    }
}

/*
    private val kord: Kord by inject()
    private var index = 0
    private val uniqueId = RandomId.generate(4)
    private lateinit var job: Job
    private lateinit var message: Message
    private val listening: Boolean
        get() = if (!this::job.isInitialized) false else this.job.isActive

 */
