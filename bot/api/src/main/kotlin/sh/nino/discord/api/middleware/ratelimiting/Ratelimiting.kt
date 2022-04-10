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

package sh.nino.discord.api.middleware.ratelimiting

import io.ktor.application.*
import io.ktor.features.*
import io.ktor.http.*
import io.ktor.response.*
import io.ktor.util.*
import kotlinx.datetime.Clock
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

class Ratelimiting(val ratelimiter: Ratelimiter) {
    companion object: ApplicationFeature<ApplicationCallPipeline, Unit, Ratelimiting> {
        override val key: AttributeKey<Ratelimiting> = AttributeKey("Ratelimiting")
        override fun install(pipeline: ApplicationCallPipeline, configure: Unit.() -> Unit): Ratelimiting {
            val ratelimiter = Ratelimiter()
            pipeline.sendPipeline.intercept(ApplicationSendPipeline.After) {
                val ip = this.call.request.origin.remoteHost
                if (ip == "0:0:0:0:0:0:0:1") {
                    proceed()
                    return@intercept
                }

                val record = ratelimiter.get(call)
                context.response.header("X-Ratelimit-Limit", 1200)
                context.response.header("X-Ratelimit-Remaining", record.remaining)
                context.response.header("X-RateLimit-Reset", record.resetTime.toEpochMilliseconds())
                context.response.header("X-RateLimit-Reset-Date", record.resetTime.toString())

                if (record.exceeded) {
                    val resetAfter = (record.resetTime.epochSeconds - Clock.System.now().epochSeconds).coerceAtLeast(0)
                    context.response.header(HttpHeaders.RetryAfter, resetAfter)
                    context.respondText(ContentType.Application.Json, HttpStatusCode.TooManyRequests) {
                        Json.encodeToString(
                            JsonObject.serializer(),
                            JsonObject(
                                mapOf(
                                    "message" to JsonPrimitive("IP ${ratelimiter.getRealHost(call)} has been ratelimited.")
                                )
                            )
                        )
                    }

                    finish()
                } else {
                    proceed()
                }
            }

            return Ratelimiting(ratelimiter)
        }
    }
}
