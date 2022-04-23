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

package sh.nino.api.exceptions

import io.ktor.http.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.sentry.Sentry
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

fun StatusPagesConfig.add401Exception() {
    exception<UnauthorisedException> { call, cause ->
        if (Sentry.isEnabled()) {
            Sentry.captureException(cause)
        }

        call.respond(cause.asStatusCode(), cause.toJsonObject())
    }
}

/**
 * Exception when the user is unauthorized to do a specific action.
 */
class UnauthorisedException(override val message: String): Exception() {
    fun toJsonObject(): JsonObject = buildJsonObject {
        put("success", false)
        put(
            "errors",
            buildJsonArray {
                add(
                    buildJsonObject {
                        put("code", "UNAUTHORIZED")
                        put("message", message)
                        put("detail", "You are not authorized to do this specific action.")
                    }
                )
            }
        )
    }

    fun asStatusCode(): HttpStatusCode = HttpStatusCode.Unauthorized
}
