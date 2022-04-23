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

package sh.nino.api.endpoints

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.routing.*

/**
 * Represents an abstraction for creating API endpoints. This is collected in the Koin module.
 * @param path The path to use for this endpoint
 * @param methods A list of methods to call this path on.
 */
abstract class AbstractEndpoint(val path: String, val methods: List<HttpMethod> = listOf(HttpMethod.Get)) {
    // TODO: type `Plugin` so the receiving `configure` can be configured successfully.
    val pluginsToRegister = mutableMapOf<Plugin<Route, *, *>, Any.() -> Unit>()

    /**
     * Represents an abstraction for creating API endpoints. This is collected in the Koin module.
     * @param path The path to use for this endpoint
     * @param method A single [HttpMethod] this endpoint supports.
     */
    constructor(path: String, method: HttpMethod): this(path, listOf(method))

    /**
     * Registers a [Plugin] to this route only, this can be useful for sessions and such. :3
     * @param plugin The plugin to register
     * @param configure The configuration of the plugin which will be called when `install` is placed
     * on the route.
     *
     * @return This endpoint to chain methods :)
     */
    fun <B: Any, C: Any> addPlugin(plugin: Plugin<Route, B, C>, configure: B.() -> Unit): AbstractEndpoint {
        @Suppress("UNCHECKED_CAST")
        pluginsToRegister[plugin] = configure as Any.() -> Unit
        return this
    }

    /**
     * Runs the endpoint once the router has reached it.
     * @param call The [ApplicationCall] from the handler.
     */
    abstract suspend fun call(call: ApplicationCall)
}
