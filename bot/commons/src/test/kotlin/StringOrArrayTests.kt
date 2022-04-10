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

package sh.nino.tests.common

import io.kotest.assertions.throwables.shouldNotThrow
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import sh.nino.discord.common.StringOrArray

class StringOrArrayTests: DescribeSpec({
    describe("StringOrArray") {
        it("should not return a error when initialized") {
            shouldNotThrow<Exception> {
                StringOrArray("owo")
            }

            shouldNotThrow<Exception> {
                StringOrArray(listOf("owo", "uwu"))
            }
        }

        it("should throw a error if initialized") {
            shouldThrow<IllegalStateException> {
                StringOrArray(123)
            }

            shouldThrow<IllegalStateException> {
                StringOrArray(true)
            }
        }

        it("should not throw if `StringOrArray.asList` is called, but throw if `StringOrArray.asString` is called") {
            val instance = StringOrArray(listOf("owo", "uwu"))
            shouldNotThrow<IllegalStateException> {
                instance.asList
            }

            shouldThrow<IllegalStateException> {
                instance.asString
            }
        }

        it("should not throw if `StringOrArray.asString` is called, but throw if `StringOrArray.asList` is called") {
            val instance = StringOrArray("owo da \${uwu}")
            shouldNotThrow<IllegalStateException> {
                instance.asString
            }

            shouldThrow<IllegalStateException> {
                instance.asList
            }
        }
    }

    describe("StringOrArray - kotlinx.serialization") {
        it("should be encoded successfully") {
            val encoded = Json.encodeToString(StringOrArray.serializer(), StringOrArray("owo"))
            encoded shouldBe "\"owo\""

            val encodedString = Json.encodeToString(StringOrArray.serializer(), StringOrArray(listOf("owo")))
            encodedString shouldBe "[\"owo\"]"
        }

        it("should be decoded successfully") {
            val decoded = Json.decodeFromString(StringOrArray.serializer(), "\"owo\"")
            shouldNotThrow<IllegalStateException> {
                decoded.asString
            }

            shouldThrow<IllegalStateException> {
                decoded.asList
            }

            val decodedList = Json.decodeFromString(StringOrArray.serializer(), "[\"owo\"]")
            shouldNotThrow<IllegalStateException> {
                decodedList.asList
            }

            shouldThrow<IllegalStateException> {
                decodedList.asString
            }
        }
    }
})
