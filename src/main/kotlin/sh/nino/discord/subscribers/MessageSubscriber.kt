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

package sh.nino.discord.subscribers

import dev.kord.core.Kord
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.core.on
import sh.nino.discord.NinoInfo
import sh.nino.discord.utils.getMultipleUsersFromArgs

private fun <T> List<T>.pairUp(): Pair<T, List<T>> = Pair(first(), drop(1))

fun Kord.applyMessageEvents() {
    on<MessageCreateEvent> {
        if (message.author?.id?.value == 280158289667555328L.toULong()) {
            val content = message.content.substring("nino ".length).trim()
            val (name, args) = content.split("\\s+".toRegex()).pairUp()

            when (name) {
                "test" -> {
                    if (args.isEmpty()) {
                        message.channel.createMessage("missing users to return.")
                        return@on
                    }

                    val users = getMultipleUsersFromArgs(args)
                    if (users.isEmpty()) {
                        message.channel.createMessage("well shit, it didn't work!")
                        return@on
                    }

                    message.channel.createMessage(users.joinToString(", ") { "${it.tag} (${it.id.asString})" })
                }

                "build" -> {
                    message.channel.createMessage("Build Info: v${NinoInfo.VERSION} (**${NinoInfo.COMMIT_HASH}**) - Build Date: ${NinoInfo.BUILD_DATE}")
                }
            }
        }
    }
}
