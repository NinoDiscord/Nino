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

import dev.kord.core.Kord
import dev.kord.x.emoji.Emojis
import dev.kord.x.emoji.toReaction
import io.ktor.client.*
import io.ktor.client.request.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import org.apache.commons.lang3.time.StopWatch
import org.koin.core.context.GlobalContext
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.extensions.elipsis
import java.io.ByteArrayOutputStream
import java.io.PrintStream
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern
import javax.script.ScriptEngineManager

@Serializable
data class HastebinResult(
    val key: String
)

@Command(
    "eval",
    "Evaluates arbitrary Kotlin code within the current Noel scope",
    aliases = ["ev", "kt", "code"],
    ownerOnly = true,
    category = CommandCategory.SYSTEM
)
class EvalCommand(
    private val httpClient: HttpClient,
    private val kord: Kord,
    private val config: Config
): AbstractCommand() {
    private val engine = ScriptEngineManager().getEngineByName("kotlin")

    override suspend fun execute(msg: CommandMessage) {
        if (msg.args.isEmpty()) {
            msg.reply("ok, what should i do? idk what to do man!")
            return
        }

        var script = msg.args.joinToString(" ")
        val silent = (msg.flags["silent"] ?: msg.flags["s"])?.asBooleanOrNull ?: false
        val stopwatch = StopWatch.createStarted()

        if (script.startsWith("```kt") && script.endsWith("```")) {
            script = script.replace("```kt", "").replace("```", "")
        }

        val koin = GlobalContext.get()
        engine.put("this", this)
        engine.put("koin", koin)
        engine.put("kord", kord)
        engine.put("msg", msg)

        val response: Any? = try {
            engine.eval(
                """
                import kotlinx.coroutines.*
                import kotlinx.coroutines.flow.*
                import kotlinx.serialization.json.*
                import kotlinx.serialization.*
                import sh.nino.discord.core.*
                import dev.kord.core.*

                $script
                """.trimIndent()
            )
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
                    appendLine("```kotlin")
                    appendLine(stacktrace.elipsis(1500))
                    appendLine("```")
                }
            )

            return
        }

        if (response != null && response.toString().length > 2000) {
            val resp: HastebinResult = httpClient.post("https://haste.red-panda.red/documents") {
                body = redact(config, response.toString())
            }

            msg.reply("<:noelHug:815113851133624342> The result of the evaluation was too long! So, I uploaded to hastebin: **<https://haste.red-panda.red/${resp.key}.kt>**")
            return
        }

        if (response == null) {
            msg.message.addReaction(Emojis.whiteCheckMark.toReaction())
            return
        }

        if (silent) return

        msg.reply(
            buildString {
                appendLine(":timer: **${stopwatch.getTime(TimeUnit.MILLISECONDS)}**ms")
                appendLine("```kotlin")
                appendLine(redact(config, response.toString()).elipsis(1500))
                appendLine("```")
            }
        )
    }

    companion object {
        fun redact(config: Config, script: String): String {
            val tokens = mutableListOf(
                config.token,
                config.database.username,
                config.database.password,
                config.redis.password,
                config.redis.host,
                config.database.host,
                config.sentryDsn,
                config.timeouts.uri,
                config.publicKey
            )

            if (config.instatus != null)
                tokens += listOf(config.instatus!!.token, config.instatus!!.gatewayMetricId)

            if (config.ravy != null)
                tokens += config.ravy

            if (config.timeouts.auth != null)
                tokens += config.timeouts.auth

            if (config.api != null)
                tokens += config.api!!.host

            if (config.botlists != null) {
                if (config.botlists!!.discordServicesToken != null)
                    tokens += config.botlists!!.discordServicesToken

                if (config.botlists!!.discordBoatsToken != null)
                    tokens += config.botlists!!.discordBoatsToken

                if (config.botlists!!.discordBoatsToken != null)
                    tokens += config.botlists!!.discordBoatsToken

                if (config.botlists!!.discordBotsToken != null)
                    tokens += config.botlists!!.discordBotsToken

                if (config.botlists!!.discordsToken != null)
                    tokens += config.botlists!!.discordsToken

                if (config.botlists!!.dellyToken != null)
                    tokens += config.botlists!!.dellyToken
            }

            return script.replace(Pattern.compile(tokens.joinToString("|"), Pattern.CASE_INSENSITIVE).toRegex(), "<redacted>")
        }
    }
}
