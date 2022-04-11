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

@file:Suppress("UNUSED")

package sh.nino.tests.commons

import io.kotest.assertions.throwables.shouldNotThrow
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.AnnotationSpec
import io.kotest.matchers.shouldBe
import kotlinx.serialization.json.Json
import sh.nino.commons.StringOrList

class StringOrListTest: AnnotationSpec() {
    @Test
    fun `should not throw an error if initialized`() {
        shouldNotThrow<Exception> {
            StringOrList("uwu")
        }

        shouldNotThrow<Exception> {
            StringOrList(listOf("uwu", "owo"))
        }
    }

    @Test
    fun `should throw an error if initialized`() {
        shouldThrow<IllegalStateException> {
            StringOrList(69420)
        }

        shouldThrow<IllegalStateException> {
            StringOrList(listOf("2222", 1))
        }
    }

    @Test
    fun `should not throw if StringOrList dot asList was called, but throw if StringOrList dot asString was called`() {
        val instance = StringOrList(listOf("owo", "uwu"))
        shouldNotThrow<IllegalStateException> {
            instance.asList
        }

        shouldThrow<IllegalStateException> {
            instance.asString
        }
    }

    @Test
    fun `should not throw if StringOrArray dot asString is called, but throw if StringOrArray dot asList is called`() {
        val instance = StringOrList("owos da uwu")
        shouldThrow<IllegalStateException> {
            instance.asList
        }

        shouldNotThrow<IllegalStateException> {
            instance.asString
        }
    }

    @Test
    fun `should encode successfully (serialization)`() {
        val encoded = Json.encodeToString(StringOrList.serializer(), StringOrList("owo"))
        encoded shouldBe "\"owo\""

        val encodedString = Json.encodeToString(StringOrList.serializer(), StringOrList(listOf("owo")))
        encodedString shouldBe "[\"owo\"]"
    }

    @Test
    fun `should decode successfully (serialization)`() {
        val decoded = Json.decodeFromString(StringOrList.serializer(), "\"owo\"")
        shouldNotThrow<IllegalStateException> {
            decoded.asString
        }

        shouldThrow<IllegalStateException> {
            decoded.asList
        }

        val decodedList = Json.decodeFromString(StringOrList.serializer(), "[\"owo\"]")
        shouldNotThrow<IllegalStateException> {
            decodedList.asList
        }

        shouldThrow<IllegalStateException> {
            decodedList.asString
        }
    }
}
