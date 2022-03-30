/*
 * Copyright (c) 2019-2022 Nino
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
import io.ktor.client.features.websocket.*
import io.ktor.client.request.*
import io.ktor.http.cio.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.serialization.json.*
import java.net.ConnectException
import kotlin.properties.Delegates

/**
 * Represents the current [client][Client] connection.
 */
internal class Connection(
    private val uri: String,
    private val auth: String = "",
    private val httpClient: HttpClient,
    private val coroutineScope: CoroutineScope,
    private val eventFlow: MutableSharedFlow<Event>,
    private val json: Json,
    private val client: Client
): CoroutineScope by coroutineScope, AutoCloseable {
    private val closeSessionDeferred = CompletableDeferred<Unit>()
    private var incomingMessageJob: Job? = null
    private val logger by logging<Connection>()
    private var session by Delegates.notNull<DefaultClientWebSocketSession>()

    private val coroutineExceptionHandler = CoroutineExceptionHandler { ctx, t ->
        logger.error("Exception in coroutine context $ctx:", t)
    }

    var closed = false

    private suspend fun internalMessageLoop() {
        logger.debug("Starting message event loop...")
        session.incoming.receiveAsFlow().collect {
            val raw = (it as Frame.Text).readText()
            val decoded = json.decodeFromString(JsonObject.serializer(), raw)

            onMessage(decoded, raw)
        }
    }

    private suspend fun onMessage(data: JsonObject, raw: String) {
        val op = data["op"]?.jsonPrimitive?.intOrNull
        logger.trace("raw data:", raw)

        if (op == null) {
            logger.warn("Missing op code in data structure...")
            return
        }

        val actualOp = try { OPCode[op] } catch (e: Exception) { null }
        if (actualOp == null) {
            logger.warn("Unknown op code: $op")
            return
        }

        when (actualOp) {
            is OPCode.Apply -> {
                val timeout = Timeout.fromJsonObject(data["d"]!!.jsonObject)
                eventFlow.emit(
                    ApplyEvent(
                        client,
                        timeout
                    )
                )
            }
        }
    }

    suspend fun send(command: Command) {
        val data = json.encodeToString(Command.Companion, command)
        logger.trace("Sending command >> ", data)
        session.send(Frame.Text(data))
    }

    private suspend fun connectionCreate(sess: DefaultClientWebSocketSession) {
        logger.info("Connected to WebSocket using URI - 'ws://$uri'")
        session = sess

        val message = try {
            sess.incoming.receive().readBytes().decodeToString()
        } catch (e: Exception) {
            null
        } ?: throw ConnectException("Connection was closed by server.")

        if (client.resources.shutdownAfterSuccess) {
            client.close()
            return
        }

        val obj = json.decodeFromString(JsonObject.serializer(), message)
        if (obj["op"]?.jsonPrimitive?.int == 0) {
            logger.debug("Hello world!")

            eventFlow.emit(ReadyEvent(client))
            incomingMessageJob = coroutineScope.launch(coroutineExceptionHandler) {
                internalMessageLoop()
            }

            closeSessionDeferred.await()

            logger.warn("Destroying connection...")
            incomingMessageJob?.cancelAndJoin()
            sess.close(
                reason = CloseReason(
                    CloseReason.Codes.GOING_AWAY,
                    "told to disconnect"
                )
            )
        }
    }

    suspend fun connect() {
        logger.debug("Connecting to microservice using URI - 'ws://$uri'")
        httpClient.ws("ws://$uri", {
            if (auth.isNotEmpty()) header("Authorization", auth)
        }) {
            connectionCreate(this)
        }
    }

    override fun close() {
        if (closed) return

        closeSessionDeferred.complete(Unit)
    }
}
