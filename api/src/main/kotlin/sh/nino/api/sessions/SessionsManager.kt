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

package sh.nino.api.sessions

import gay.floof.utils.slf4j.logging
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.util.*
import kotlinx.coroutines.future.await
import kotlinx.serialization.SerialName
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.slf4j.MDC
import sh.nino.core.redis.Manager
import java.util.UUID

/**
 * Represents a session object, which is stored in Redis under the hash table: `nino:sessions`.
 *
 * This only appends the user's ID, the session ID, and the access/refresh token from Discord.
 */
@kotlinx.serialization.Serializable
data class Session(
    @SerialName("refresh_token")
    val refreshToken: String,

    @SerialName("access_token")
    val accessToken: String,

    @SerialName("user_id")
    val userId: String,
    val id: String
)

class SessionsManager(private val redis: Manager, private val json: Json) {
    companion object {
        val SessionKey = AttributeKey<Session>("NinoSession")
    }

    private val log by logging<SessionsManager>()

    val Plugin = createApplicationPlugin("NinoSessionsPlugin") {
        onCall { call ->
            // Add the user agent to the MDC, so Logstash can append it to
            // the payload for monitoring reasons. :)
            MDC.put("user_agent", call.request.userAgent())

            // Check if we have the `session_id` cookie
            val cookie = call.request.cookies["session_id"]
                ?: run {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        buildJsonObject {
                            put("success", false)
                            put(
                                "errors",
                                buildJsonArray {
                                    add(
                                        buildJsonObject {
                                            put("code", "MISSING_COOKIE")
                                            put("message", "Missing `session_id` cookie. :(")
                                        }
                                    )
                                }
                            )
                        }
                    )

                    return@onCall
                }

            val data = redis.commands.get("sessions:$cookie").await() ?: run {
                call.respond(
                    HttpStatusCode.Unauthorized,
                    buildJsonObject {
                        put("success", false)
                        put(
                            "errors",
                            buildJsonArray {
                                add(
                                    buildJsonObject {
                                        put("code", "UNKNOWN_SESSION")
                                        put("message", "Session doesn't exist or was expired, please re-login.")
                                    }
                                )
                            }
                        )
                    }
                )

                return@onCall
            }

            val session = json.decodeFromString<Session>(data)

            // add it to the call and continue
            call.attributes.put(SessionKey, session)
            MDC.put("user_id", session.userId)
        }
    }

    suspend fun create(
        accessToken: String,
        refreshToken: String,
        userId: String
    ): Session {
        val id = UUID.randomUUID().toString()
        val session = Session(
            refreshToken,
            accessToken,
            userId,
            id
        )

        // Decode it to a string, so it can be put in Redis
        val sessionStr = json.encodeToString(Session.serializer(), session)

        redis.commands.set("nino:sessions:$id", sessionStr).await()
        redis.commands.setex("nino:sessions:$id", 604800, sessionStr).await()

        return session
    }
}
