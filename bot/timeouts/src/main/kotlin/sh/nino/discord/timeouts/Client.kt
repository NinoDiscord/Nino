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

package sh.nino.discord.timeouts

import gay.floof.utils.slf4j.logging
import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.features.json.*
import io.ktor.client.features.json.serializer.*
import io.ktor.client.features.websocket.*
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

@OptIn(ExperimentalContracts::class)
fun Client(builder: ClientBuilder.() -> Unit): Client {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }

    val resources = ClientBuilder().apply(builder).build()
    return Client(resources)
}

class Client(val resources: ClientResources): AutoCloseable {
    private lateinit var connection: Connection
    private val logger by logging<Client>()

    val closed: Boolean
        get() = if (::connection.isInitialized) connection.closed else true

    override fun close() {
        if (!::connection.isInitialized) return
        if (connection.closed) return

        return connection.close()
    }

    suspend fun connect() {
        if (this::connection.isInitialized) return

        logger.info("Connecting to WebSocket...")
        val httpClient = resources.httpClient?.config {
            install(WebSockets)
        } ?: HttpClient(OkHttp) {
            engine {
                config {
                    followRedirects(true)
                }
            }

            install(WebSockets)
            install(JsonFeature) {
                serializer = KotlinxSerializer(resources.json)
            }
        }

        connection = Connection(
            resources.uri,
            resources.auth,
            httpClient,
            resources.coroutineScope,
            resources.eventFlow,
            resources.json,
            this
        )

        return connection.connect()
    }

    suspend fun send(command: Command) {
        if (!::connection.isInitialized) return
        return connection.send(command)
    }
}
