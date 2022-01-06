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

package sh.nino.discord.common

import kotlinx.serialization.Serializable
import sh.nino.discord.common.extensions.every
import sh.nino.discord.common.serializers.StringOrArraySerializer

/**
 * This class exists, so we can perform operations if we have a [List] or a [String].
 */
@Serializable(with = StringOrArraySerializer::class)
class StringOrArray(private val value: Any) {
    init {
        check(value is List<*> || value is String) { "`value` is not a supplied List, Array, or a String." }

        if (value is List<*>) {
            check(value.every { it is String })
        }
    }

    @Suppress("UNCHECKED_CAST")
    val asList: List<String>
        get() = value as? List<String> ?: error("Value was not a instance of `List<String>`.")

    @Suppress("UNCHECKED_CAST")
    val asString: String
        get() = value as? String ?: error("Value was not a instance of `String`")

    @Suppress("UNCHECKED_CAST")
    val asListOrNull: List<String>?
        get() = value as? List<String>
}
