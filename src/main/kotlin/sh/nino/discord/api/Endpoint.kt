package sh.nino.discord.api

import sh.nino.discord.api.annotations.Route
import kotlin.reflect.full.findAnnotations

/**
 * Represents a API endpoint.
 * @param prefix The prefix to use.
 */
class Endpoint(val prefix: String) {
    /**
     * Returns all the routes registered to this [Endpoint]
     */
    @OptIn(ExperimentalStdlibApi::class)
    val routes: List<Route>
        get() = this::class.findAnnotations()

    companion object {
        fun mergePrefixes(prefix: String, other: String): String {
            if (other == "/") return prefix

            return "${if (prefix == "/") "" else prefix}$other"
        }
    }
}
