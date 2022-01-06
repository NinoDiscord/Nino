package sh.nino.tests.common

import io.kotest.assertions.throwables.shouldNotThrow
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import kotlinx.serialization.builtins.ListSerializer
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
