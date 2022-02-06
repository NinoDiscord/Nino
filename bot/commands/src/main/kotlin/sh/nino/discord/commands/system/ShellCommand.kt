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

package sh.nino.discord.commands.system

import dev.kord.x.emoji.Emojis
import dev.kord.x.emoji.toReaction
import io.ktor.client.*
import io.ktor.client.request.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.apache.commons.lang3.time.StopWatch
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.extensions.elipsis
import sh.nino.discord.common.extensions.shell
import java.io.ByteArrayOutputStream
import java.io.PrintStream
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

@Command(
    "shell",
    "Executes shell commands within the current context.",
    aliases = ["exec", "$", "$>", "sh"],
    ownerOnly = true,
    category = CommandCategory.SYSTEM
)
class ShellCommand(private val config: Config, private val httpClient: HttpClient): AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        if (msg.args.isEmpty()) {
            msg.reply("ok, what should i do? idk what to do man!")
            return
        }

        var script = msg.args.joinToString(" ")
        val silent = (msg.flags["silent"] ?: msg.flags["s"])?.asYOrNull ?: false
        val stopwatch = StopWatch.createStarted()

        if (script.startsWith("```sh") && script.endsWith("```")) {
            script = script.replace("```sh", "").replace("```", "")
        }

        val response: Any = try {
            script.shell()
        } catch (e: Exception) {
            e
        }

        stopwatch.stop()
        if (response is Exception) {
            val baos = ByteArrayOutputStream()
            val stream = withContext(Dispatchers.IO) {
                PrintStream(baos, true, StandardCharsets.UTF_8.name())
            }

            stream.use { response.printStackTrace(stream) }

            val stacktrace = withContext(Dispatchers.IO) {
                baos.toString(StandardCharsets.UTF_8.name())
            }

            msg.reply(
                buildString {
                    appendLine(":timer: **${stopwatch.getTime(TimeUnit.MILLISECONDS)}**ms")
                    appendLine("```sh")
                    appendLine(stacktrace.elipsis(1500))
                    appendLine("```")
                }
            )

            return
        }

        if (response.toString().length > 2000) {
            val resp: HastebinResult = httpClient.post("https://haste.red-panda.red/documents") {
                body = EvalCommand.redact(config, response.toString())
            }

            msg.reply("<:noelHug:815113851133624342> The result of the evaluation was too long! So, I uploaded to hastebin: **<https://haste.red-panda.red/${resp.key}.sh>**")
            return
        }

        if (response.toString().isEmpty()) {
            msg.message.addReaction(Emojis.whiteCheckMark.toReaction())
            return
        }

        if (silent) return

        msg.reply(
            buildString {
                appendLine(":timer: **${stopwatch.getTime(TimeUnit.MILLISECONDS)}**ms")
                appendLine("```sh")
                appendLine(EvalCommand.redact(config, response.toString()).elipsis(1500))
                appendLine("```")
            }
        )
    }
}
