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

package sh.nino.modules.localisation

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import sh.nino.commons.StringOrList
import java.io.File
import java.util.regex.Pattern

/**
 * Represents the metadata of a [Locale] object.
 *
 * @param contributors A list of contributors by their ID that contributed to this language
 * @param translator The translator's ID that translated this language.
 * @param aliases A list of aliases when setting this [Locale].
 * @param code The IANA code that is used for this [Locale].
 * @param flag The flag emoji (i.e, `:flag_us:`) for presentation purposes.
 * @param name The locale's full name.
 */
@Serializable
data class LocalizationMeta(
    val contributors: List<String> = listOf(),
    val translator: String,
    val aliases: List<String> = listOf(),
    val code: String,
    val flag: String,
    val name: String
)

private val KEY_REGEX = Pattern.compile("[\$]\\{([\\w\\.]+)\\}").toRegex()

@Serializable
data class Locale(
    val meta: LocalizationMeta,
    val strings: Map<String, StringOrList>
) {
    companion object {
        fun fromFile(file: File, json: Json): Locale {
            return json.decodeFromString(serializer(), file.readText())
        }
    }

    fun translate(key: String, args: Map<String, Any> = mapOf()): String {
        val format = strings[key] ?: error("Key \"$key\" was not found.")
        val stringsToTranslate = format.asListOrNull?.joinToString("\n") ?: format.asString

        return KEY_REGEX.replace(stringsToTranslate, transform = {
            args[it.groups[1]!!.value].toString()
        })
    }
}
