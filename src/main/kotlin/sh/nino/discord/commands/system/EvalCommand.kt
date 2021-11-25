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
import kotlinx.serialization.Serializable
import org.apache.commons.lang3.time.StopWatch
import org.koin.core.context.GlobalContext
import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandCategory
import sh.nino.discord.core.command.CommandMessage
import sh.nino.discord.extensions.elipsis
import java.io.ByteArrayOutputStream
import java.io.PrintStream
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit
import javax.script.ScriptEngineManager

@Serializable
data class HastebinResult(
    val key: String
)

@Command(
    name = "eval",
    description = "Evaluate some arbitrary Kotlin code to return a result, probably.",
    category = CommandCategory.SYSTEM,
    ownerOnly = true,
    aliases = ["evl", "e", "kt"]
)
class EvalCommand(private val httpClient: HttpClient, private val kord: Kord): AbstractCommand() {
    private val engine = ScriptEngineManager().getEngineByName("kotlin")

    override suspend fun run(msg: CommandMessage) {
        if (msg.args.isEmpty()) {
            msg.reply(":thinking:")
            return
        }

        val message = msg.reply(":pencil2: Now evaluating...")
        val script = msg.args.joinToString(" ")

        // create a context object
        engine.put("this", this)
        engine.put("msg", msg)
        engine.put("koin", GlobalContext.get())
        engine.put("kord", kord)

        // We need to do this in the scope since some calls can be suspended.
        val watch = StopWatch()
        watch.start()

        var exception: Exception? = null
        val res = try {
            engine.eval(script)
        } catch (e: Exception) {
            exception = e
            null
        }

        watch.stop()

        if (res != null && res.toString().length > 1995) {
            val resp: HastebinResult = httpClient.post("https://haste.red-panda.red/documents") {
                body = res.toString()
            }

            msg.reply("The result was too long from your script, so I uploaded to Hastebin: <https://haste.red-panda.red/${resp.key}.kt>")
            return
        }

        message.delete()
        if (res == null && exception == null) {
            kord.rest.channel.createReaction(
                msg.message.channelId,
                msg.message.id,
                "\uD83D\uDC4D"
            )

            return
        }

        val timeCompleted = watch.getTime(TimeUnit.MILLISECONDS)
        if (exception != null) {
            val baos = ByteArrayOutputStream()
            PrintStream(baos, true, StandardCharsets.UTF_8.name()).use {
                exception.printStackTrace(it)
            }

            val stacktrace = baos.toString(StandardCharsets.UTF_8.name())
            msg.reply(
                buildString {
                    appendLine(":watch: **${timeCompleted}ms**")
                    appendLine("```kotlin")
                    appendLine(stacktrace.elipsis(1500))
                    appendLine("```")
                }
            )
        } else {
            msg.reply(
                buildString {
                    appendLine(":watch: **${timeCompleted}ms**")
                    appendLine("```kotlin")
                    appendLine(res)
                    appendLine("```")
                }
            )
        }
    }
}
