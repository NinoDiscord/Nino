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

package sh.nino.modules.scripting.ruby

import gay.floof.utils.slf4j.logging
import kotlinx.datetime.Clock
import org.jruby.Ruby
import org.jruby.RubyModule
import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets
import java.util.stream.Collectors

class RubyScripter {
    private val log by logging<RubyScripter>()

    private lateinit var ninoModule: RubyModule
    private lateinit var jruby: Ruby

    val name: String = "ruby"

    fun init() {
        log.debug("Building JRuby instance...")

        jruby = Ruby.getGlobalRuntime()
        ninoModule = jruby.getOrCreateModule("Nino")
    }

    fun execute(script: String): Any? {
        val preludeScript = this::class.java.getResourceAsStream("/prelude.rb") ?: error("Unable to get prelude script")
        val preludeText = preludeScript.use {
            BufferedReader(InputStreamReader(it, StandardCharsets.UTF_8)).lines().collect(Collectors.joining("\n"))
        }

        val fileName = "nino_rubyscript_${Clock.System.now().toEpochMilliseconds()}.rb"
        return jruby.executeScript(
            """
            $preludeText
            $script
            """.trimIndent(),
            fileName
        )
    }
}
