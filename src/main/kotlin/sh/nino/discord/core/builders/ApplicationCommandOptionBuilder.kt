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

package sh.nino.discord.core.builders

import kotlinx.serialization.json.JsonObject
import sh.nino.discord.core.annotations.NinoDslMarker
import sh.nino.discord.extensions.asJson
import java.lang.IllegalArgumentException

/**
 * Represents a builder object for constructing slash command options.
 */
@NinoDslMarker
class ApplicationCommandOptionBuilder {
    private var choices: MutableList<Pair<String, Any>> = mutableListOf()
    var description: String = ""
    var options: Any = ""
    var name: String = ""

    fun choices(vararg choices: Pair<String, Any>): ApplicationCommandOptionBuilder {
        for (choice in choices) {
            val (name, value) = choice

            // Since choices can be strings, ints, or doubles
            // let's check for it
            if (value is String || value is Int || value is Double) {
                this.choices.add(name to value)
            } else {
                throw IllegalArgumentException("Unable to cast ${value::class} -> String, Int, or Double.")
            }
        }

        return this
    }

    fun toJsonObject(): JsonObject = JsonObject(
        mapOf(
            "name" to name.asJson(),
            "description" to description.asJson()
        )
    )
}
