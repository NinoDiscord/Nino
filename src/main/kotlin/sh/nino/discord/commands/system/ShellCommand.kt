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

package sh.nino.discord.commands.system

import dev.kord.core.Kord
import io.ktor.client.*
import io.ktor.client.request.*
import org.apache.commons.lang3.time.StopWatch
import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandCategory
import sh.nino.discord.core.command.CommandMessage
import sh.nino.discord.extensions.shell
import java.util.concurrent.TimeUnit

@Command(
    name = "shell",
    description = "Executes arbitary shell commands.",
    aliases = ["sh", "exec", "$"],
    category = CommandCategory.SYSTEM
)
class ShellCommand(private val kord: Kord, private val httpClient: HttpClient): AbstractCommand() {
    override suspend fun run(msg: CommandMessage) {
        if (msg.args.isEmpty()) {
            msg.reply(":thinking:")
            return
        }

        val script = msg.args.joinToString(" ")
        val watch = StopWatch()
        watch.start()

        val res = script.shell()
        watch.stop()

        if (res.isEmpty() || res.isBlank()) {
            kord.rest.channel.createReaction(
                msg.message.channelId,
                msg.message.id,
                "\uD83D\uDC4D"
            )

            return
        }

        if (res.length > 1995) {
            val resp: HastebinResult = httpClient.post("https://haste.red-panda.red/documents") {
                body = res
            }

            msg.reply("The result was too long from your script, so I uploaded to Hastebin: <https://haste.red-panda.red/${resp.key}.kt>")
            return
        }

        msg.reply(
            buildString {
                appendLine(":watch: **${watch.getTime(TimeUnit.MILLISECONDS)}**ms")
                appendLine()
                appendLine("```shell")
                appendLine(res)
                appendLine("```")
            }
        )
    }
}
