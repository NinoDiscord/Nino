/**
 * Copyright (c) 2019-2021 Nino
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

package sh.nino.discord.modules.timeouts

import io.ktor.client.*
import io.ktor.client.features.websocket.*
import org.koin.core.context.GlobalContext
import sh.nino.discord.data.Config
import sh.nino.discord.extensions.inject
import sh.nino.discord.kotlin.logging

class TimeoutsModule(private val config: Config, private val httpClient: HttpClient): AutoCloseable {
    private lateinit var connection: TimeoutsConnection
    private val logger by logging<TimeoutsModule>()

    override fun close() {
        // If the connection is not already initialized, return it as a no-op.
        if (!this::connection.isInitialized) return

        // Close it now.
        connection.close()
    }

    suspend fun connect() {
        // If the connection is already initialized, return it as a no-op.
        if (this::connection.isInitialized) return

        logger.info("Connecting to timeouts service...")

        // Modify the HTTP client we used to run a WebSocket connection.
        // This isn't implemented in the actual http client for a reason. :>
        val client = httpClient.config {
            install(WebSockets)
        }

        // Initialize the property.
        connection = TimeoutsConnection(
            config.timeouts.uri,
            config.timeouts.auth,
            client,
            GlobalContext.inject()
        )

        return connection.connect()
    }
}
