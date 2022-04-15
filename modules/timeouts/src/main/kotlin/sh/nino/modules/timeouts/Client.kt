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

package sh.nino.modules.timeouts

import gay.floof.utils.slf4j.logging
import io.ktor.client.*
import io.ktor.client.features.websocket.*
import io.ktor.client.request.*
import io.ktor.http.cio.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.*
import sh.nino.modules.timeouts.types.ApplyEvent
import sh.nino.modules.timeouts.types.Command
import sh.nino.modules.timeouts.types.Event
import sh.nino.modules.timeouts.types.OperationType
import sh.nino.modules.timeouts.types.ReadyEvent
import sh.nino.modules.timeouts.types.Response
import sh.nino.modules.timeouts.types.StatsResponse
import sh.nino.modules.timeouts.types.Timeout
import sh.nino.modules.timeouts.types.TimeoutsResponse
import sh.nino.modules.timeouts.types.fromJsonObject
import kotlin.time.Duration.Companion.seconds

/**
 * Represents the main gateway connection towards the Timeouts microservice.
 */
class Client(
    private val uri: String,
    private val auth: String = "",
    private val httpClient: HttpClient,
    private val coroutineScope: CoroutineScope,
    private val eventFlow: MutableSharedFlow<Event>,
    private val json: Json
): CoroutineScope by coroutineScope, AutoCloseable {
    private val closeDeferred = CompletableDeferred<Unit>()
    private var messageFlowJob: Job? = null
    private val log by logging<Client>()
    private var session: DefaultWebSocketSession? = null

    private val coroutineExceptionHandler = CoroutineExceptionHandler { ctx, t ->
        log.error("Exception in coroutine $ctx:", t)
    }

    var closed = false

    private suspend fun createMessageFlow() {
        log.debug("Creating event loop...")

        session!!.incoming.receiveAsFlow().collect {
            if ((it as? Frame.Close) != null) {
                onClose(it)
                return@collect
            }

            val raw = (it as? Frame.Text)?.readText() ?: error("Frame was not `Frame.Text`")
            val decoded = json.decodeFromString(JsonObject.serializer(), raw)

            onMessage(decoded, raw)
        }
    }

    private suspend fun onClose(frame: Frame.Close) {
        val reason = frame.readReason() ?: return
        log.warn("Server closed connection (${reason.code} ${reason.message}), re-connecting in 5 minutes...")

        closed = true
        session = null
        withTimeout(5.seconds) {
            connect()
        }
    }

    private suspend fun onMessage(data: JsonObject, raw: String) {
        val type = data["op"]?.jsonPrimitive?.intOrNull
        log.trace("data: $raw")

        if (type == null) {
            log.error("Received message but missing `op`: int value.")
            return
        }

        when (OperationType[type]) {
            is OperationType.Apply -> {
                val timeout = Timeout.fromJsonObject(data)
                eventFlow.emit(ApplyEvent(this, timeout))
            }
        }
    }

    private suspend fun connectionHandler(sess: DefaultWebSocketSession) {
        log.info("Connected to WebSocket using URI - 'ws://$uri'!")
        session = sess

        // Receive the first message
        val message = try {
            sess.incoming.receive().readBytes().decodeToString()
        } catch (e: Exception) {
            null
        }

        if (message == null) {
            onClose(Frame.Close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Server still down.")))
            return
        }

        // If it was closed, let's not make it closed. >:(
        if (closed)
            closed = false

        val obj = json.decodeFromString(JsonObject.serializer(), message)
        if (obj["op"]?.jsonPrimitive?.int == 0) {
            log.debug("Received READY event from server, hello world!")

            eventFlow.emit(ReadyEvent(this))
            messageFlowJob = coroutineScope.launch(coroutineExceptionHandler) {
                createMessageFlow()
            }

            closeDeferred.await()

            log.warn("Shutting connection...")
            messageFlowJob?.cancelAndJoin()
            sess.close(CloseReason(CloseReason.Codes.GOING_AWAY, "Connection was closed by user."))
        }
    }

    suspend fun send(command: Command) {
        val data = json.encodeToString(Command.Companion, command)
        log.trace("Sending data >> $data")

        session!!.send(Frame.Text(data))
    }

    suspend fun <T: Response> sendAndReceive(command: Command): T {
        val data = json.encodeToString(Command.Companion, command)
        log.trace("Sending data >> $data")

        session!!.send(Frame.Text(data))

        val resp = session!!.incoming.receive().readBytes().decodeToString()
        val obj = json.decodeFromString(JsonObject.serializer(), resp)

        when (val op = obj["op"]?.jsonPrimitive?.int) {
            OperationType.Stats.code -> {
                @Suppress("UNCHECKED_CAST")
                return json.decodeFromJsonElement(StatsResponse.serializer(), obj["d"]!!) as T
            }

            OperationType.RequestAll.code -> {
                val timeouts = json.decodeFromJsonElement(ListSerializer(Timeout.serializer()), obj["d"]!!)

                @Suppress("UNCHECKED_CAST")
                return TimeoutsResponse(timeouts) as T
            }

            else -> error("Unexpected operation type when sending command $command: $op")
        }
    }

    suspend fun connect() {
        log.debug("Connecting to timeouts microservice using URI - 'ws://$uri'...")
        httpClient.ws("ws://$uri", {
            if (auth.isNotEmpty()) header("Authorization", auth)
        }) {
            connectionHandler(this)
        }
    }

    override fun close() {
        if (closed) return

        closeDeferred.complete(Unit)
    }
}
