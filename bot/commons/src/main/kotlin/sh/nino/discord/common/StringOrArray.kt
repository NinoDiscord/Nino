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
