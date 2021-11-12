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

import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.entity.Message
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.TextChannel
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.rest.builder.message.EmbedBuilder
import dev.kord.rest.builder.message.create.allowedMentions
import org.koin.core.Koin
import org.koin.core.context.GlobalContext
import sh.nino.discord.core.messaging.PaginationEmbed
import sh.nino.discord.utils.Constants
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

class CommandMessage(event: MessageCreateEvent, val args: List<String>) {
    private val koin: Koin = GlobalContext.get()

    val message: Message = event.message
    val author: User = message.author ?: error("this should never happen")

    suspend fun createPaginationEmbed(embeds: List<EmbedBuilder>): PaginationEmbed {
        val channel = message.channel.asChannel() as TextChannel
        return PaginationEmbed(channel, author, embeds)
    }

    suspend fun reply(_content: String, reply: Boolean): Message =
        message.channel.createMessage {
            content = _content

            if (reply) {
                messageReference = message.id
                allowedMentions {
                    repliedUser = false
                }
            }
        }

    suspend fun reply(content: String): Message = reply(content, true)

    @OptIn(ExperimentalContracts::class)
    suspend fun reply(_content: String, reply: Boolean, block: EmbedBuilder.() -> Unit): Message {
        contract { callsInPlace(block, InvocationKind.EXACTLY_ONCE) }

        val embed = EmbedBuilder().apply(block)
        embed.color = Constants.COLOR

        return message.channel.createMessage {
            content = _content
            embeds += embed

            if (reply) {
                messageReference = message.id
                allowedMentions {
                    repliedUser = false
                }
            }
        }
    }

    @OptIn(ExperimentalContracts::class)
    suspend fun reply(content: String, block: EmbedBuilder.() -> Unit): Message {
        contract { callsInPlace(block, InvocationKind.EXACTLY_ONCE) }
        return reply(content, true, block)
    }

    @OptIn(ExperimentalContracts::class)
    suspend fun replyEmbed(reply: Boolean = true, block: EmbedBuilder.() -> Unit): Message {
        contract { callsInPlace(block, InvocationKind.EXACTLY_ONCE) }
        return message.channel.createMessage {
            this.embeds += EmbedBuilder().apply(block)

            if (reply) {
                messageReference = message.id
                allowedMentions {
                    repliedUser = false
                }
            }
        }
    }
}
