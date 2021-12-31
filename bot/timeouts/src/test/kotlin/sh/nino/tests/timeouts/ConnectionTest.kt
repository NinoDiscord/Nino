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

package sh.nino.tests.timeouts

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldStartWith
import sh.nino.discord.timeouts.Client
import java.net.ConnectException

class ConnectionTest: DescribeSpec({
    it("bleep boop") {
        1 + 1 shouldBe 2
    }

    it("should not connect due to not finding it.") {
        val client = Client {
            // in ci + in-dev, this shouldn't exist
            // i hope...
            uri = "localhost:6666"
            auth = "owodauwu"
        }

        val exception = shouldThrow<ConnectException> {
            client.connect()
        }

        exception.message shouldStartWith "Failed to connect"
    }

    // Commented out due to not knowing how to do this with GitHub actions
//    it("should connect with valid auth") {
//        val isCI = System.getenv("GITHUB_ACTIONS") != null
//        val client = Client {
//            uri = if (isCI) "timeouts:4025" else "localhost:4025"
//            auth = "owodauwu"
//            shutdownAfterSuccess = true
//        }
//
//        shouldNotThrow<ConnectException> {
//            client.connect()
//        }
//    }
//
//    it("should error with bad auth") {
//        val client = Client {
//            uri = "localhost:4025"
//            auth = "fuck"
//        }
//
//        val exception = shouldThrow<Exception> { client.connect() }
//        exception.message shouldBe "Connection was closed by server."
//    }
})
