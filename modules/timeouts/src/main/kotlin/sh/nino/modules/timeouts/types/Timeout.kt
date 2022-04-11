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
