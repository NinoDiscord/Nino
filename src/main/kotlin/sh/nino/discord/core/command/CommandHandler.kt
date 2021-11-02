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
import dev.kord.rest.builder.message.create.embed
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.firstOrNull
import org.koin.core.context.GlobalContext
import sh.nino.discord.data.Config
import sh.nino.discord.kotlin.logging
import sh.nino.discord.modules.prometheus.PrometheusModule
import sh.nino.discord.utils.Constants

private fun <T, U> List<Pair<T, U>>.toMappedPair(): Map<T, U> {
    val map = mutableMapOf<T, U>()
    for (item in this) {
        map[item.first] = item.second
    }

    return map.toMap()
}

class CommandHandler(
    private val config: Config,
    private val prometheus: PrometheusModule,
    private val kord: Kord
) {
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

        // Retrieve the guild, if there is no guild (i.e, DM)
        val guild = event.getGuild() ?: return

        // Now we do command handling
        val self = guild.members.filter { it.id == kord.selfId }.firstOrNull() ?: return
        val wasMentioned =
            event.message.content.startsWith("<@${kord.selfId.asString}") || event.message.content.startsWith("<@!${kord.selfId.asString}>")

        val prefixLen = if (wasMentioned) self.mention.length + 1 else "nino ".length
        if (!event.message.content.startsWith("nino ") && !wasMentioned) return
        if (wasMentioned && !event.message.content.contains(" ")) {
            val self = kord.getSelf()
            event.message.channel.createMessage {
                content = ":wave: Hello, I am **${self.tag}**!"
                embeds += EmbedBuilder().apply {
                    color = Constants.COLOR
                    description = buildString {
                        appendLine("I operate this guild (**${guild.name}**)")
                    }
                }
            }
        }
    }
}
