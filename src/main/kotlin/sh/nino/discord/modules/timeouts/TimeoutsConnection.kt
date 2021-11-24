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
import io.ktor.client.request.*
import io.ktor.http.cio.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.serialization.json.*
import org.redisson.api.RedissonClient
import sh.nino.discord.core.NinoScope
import sh.nino.discord.kotlin.inject
import sh.nino.discord.kotlin.logging
import sh.nino.discord.modules.timeouts.payload.Command
import sh.nino.discord.modules.timeouts.payload.OperationType
import sh.nino.discord.modules.timeouts.payload.Timeout
import kotlin.properties.Delegates

class TimeoutsConnection(
    private val uri: String,
    private val auth: String,
    private val httpClient: HttpClient,
    private val redis: RedissonClient
): CoroutineScope by NinoScope, AutoCloseable {
    private var defaultWsSession: DefaultClientWebSocketSession by Delegates.notNull()
    private var messageQueueJob: Job? = null
    private val closeEvent = CompletableDeferred<Unit>()
    private val json by inject<Json>()

    private val logger by logging<TimeoutsConnection>()
    private val exceptionHandler = CoroutineExceptionHandler { _, throwable ->
        logger.error("Unknown exception occurred while running a Job:", throwable)
    }

    override fun close() {
        logger.warn("Closing connection from Timeouts service...")
        closeEvent.complete(Unit)
    }

    private suspend fun createMessageLoop() {
        defaultWsSession.incoming.receiveAsFlow().collect {
            val raw = (it as Frame.Text).readText()
            val data = json.decodeFromString(JsonObject.serializer(), raw)

            onPacket(data, raw)
        }
    }

    private fun onPacket(data: JsonObject, raw: String) {
        logger.debug("Received payload: %s", raw)

        val op = data["op"]?.jsonPrimitive?.intOrNull ?: error("Unable to find operation type.")
        when (op) {
            OperationType.Ready.op -> {
                logger.info("We have authenticated successfully!")

                val timeouts = redis.getMap<String, String>("nino:timeouts").readAllValues()
                println(timeouts)
            }

            OperationType.Apply.op -> {
                logger.info("Told to apply a packet")

                val rawData = data["d"]?.jsonObject ?: error("Unable to deserialize data.")
                val timeout = json.decodeFromJsonElement(Timeout.serializer(), rawData)
                val cached = redis.getMap<String, String>("nino:timeouts")
            }
        }
    }

    private suspend fun onConnection(conn: DefaultClientWebSocketSession) {
        logger.info("Connected to WebSocket using URI - 'ws://$uri'")

        defaultWsSession = conn
        messageQueueJob = NinoScope.launch(exceptionHandler) {
            createMessageLoop()
        }

        logger.info("Setup message queue, now waiting for a close event...")
        closeEvent.await()

        logger.warn("We were told to close.")
        messageQueueJob?.cancel(CancellationException("Close event was completed."))
    }

    suspend fun send(command: Command) {
        val data = json.encodeToString(Command, command)
        defaultWsSession.send(Frame.Text(data))
    }

    suspend fun connect() {
        httpClient.ws("ws://$uri", {
            header("Authorization", auth)
        }) {
            onConnection(this)
        }
    }
}
