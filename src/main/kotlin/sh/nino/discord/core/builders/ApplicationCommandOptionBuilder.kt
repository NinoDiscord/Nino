package sh.nino.discord.core.builders

import kotlinx.serialization.json.JsonObject
import sh.nino.discord.core.annotations.NinoDslMarker
import sh.nino.discord.extensions.asJson
import java.lang.IllegalArgumentException

/**
 * Represents a builder object for constructing slash command options.
 */
@NinoDslMarker
class ApplicationCommandOptionBuilder {
    private var choices: MutableList<Pair<String, Any>> = mutableListOf()
    var description: String = ""
    var options: Any = ""
    var name: String = ""

    fun choices(vararg choices: Pair<String, Any>): ApplicationCommandOptionBuilder {
        for (choice in choices) {
            val (name, value) = choice

            // Since choices can be strings, ints, or doubles
            // let's check for it
            if (value is String || value is Int || value is Double) {
                this.choices.add(name to value)
            } else {
                throw IllegalArgumentException("Unable to cast ${value::class} -> String, Int, or Double.")
            }
        }

        return this
    }

    fun toJsonObject(): JsonObject = JsonObject(
        mapOf(
            "name" to name.asJson()
        )
    )
}
