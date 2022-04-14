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

package sh.nino.modules.timeouts.types

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

/**
 * Represents the timeout as a serializable object. ([source](https://github.com/NinoDiscord/timeouts/blob/master/pkg/types.go#L38-L46))
 */
@Serializable
data class Timeout(
    @SerialName("guild_id")
    val guildId: String,

    @SerialName("user_id")
    val userId: String,

    @SerialName("issued_at")
    val issuedAt: Long,

    @SerialName("expires_at")
    val expiresIn: Long,

    @SerialName("moderator_id")
    val moderatorId: String,
    val reason: String? = null,
    val type: String
)

fun Timeout.Companion.fromJsonObject(data: JsonObject): Timeout = Timeout(
    guildId = data["guild_id"]!!.jsonPrimitive.content,
    userId = data["user_id"]!!.jsonPrimitive.content,
    issuedAt = data["issued_at"]!!.jsonPrimitive.long,
    expiresIn = data["expires_in"]!!.jsonPrimitive.long,
    moderatorId = data["moderator_id"]!!.jsonPrimitive.content,
    reason = data["reason"]?.jsonPrimitive?.content,
    type = data["type"]!!.jsonPrimitive.content
)
