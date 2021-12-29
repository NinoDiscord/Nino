package sh.nino.discord.api.annotations

/**
 * Represents an annotation to register a route to a specific [Endpoint][sh.nino.discord.api.Endpoint].
 *
 * @param path The path to use. By default, the API will append the route path to the endpoint prefix, so
 * `/metrics` is the endpoint prefix and `/` is the route path, it will return `/metrics` and vice-versa.
 * @param method The HTTP method to use, if the method is not found, the API server will throw an error.
 * @param auth If the route requires authentication
 */
annotation class Route(
    val path: String,
    val method: String,
    val auth: Boolean = false
)
