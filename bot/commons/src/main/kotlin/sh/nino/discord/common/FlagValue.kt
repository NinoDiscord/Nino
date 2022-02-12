package sh.nino.discord.common

/**
 * Represents a value of a command flag (`-c`, `--c=owo`, `-c owo`)
 */
class FlagValue(private val value: Any) {
    init {
        check(value is String || value is Boolean) {
            "Value was not a String or Boolean, received ${value::class}"
        }
    }

    val asString: String
        get() = asStringOrNull ?: error("Unable to cast value to String from ${value::class}")

    val asBoolean: Boolean
        get() = asBooleanOrNull ?: error("Unable to cast value to Boolean from ${value::class}")

    val asStringOrNull: String?
        get() = value as? String

    val asBooleanOrNull: Boolean?
        get() = value as? Boolean
}
