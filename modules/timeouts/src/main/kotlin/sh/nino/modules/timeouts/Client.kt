package sh.nino.modules.timeouts

import gay.floof.utils.slf4j.logging
import io.ktor.client.*
import io.ktor.client.features.websocket.*
import io.ktor.client.request.*
import io.ktor.http.cio.websocket.*
import io.sentry.Sentry
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.*
import sh.nino.modules.timeouts.types.*
import java.net.ConnectException
import kotlin.properties.Delegates

/**
 * Represents the main gateway connection towards the Timeouts microservice.
 */
class Client(
    private val uri: String,
    private val auth: String = "",
    private val httpClient: HttpClient,
    private val coroutineScope: CoroutineScope,
    private val eventFlow: MutableSharedFlow<Event>,
    private val json: Json,
    private val module: TimeoutsModule
): CoroutineScope by coroutineScope, AutoCloseable {
    private val closeDeferred = CompletableDeferred<Unit>()
    private var messageFlowJob: Job? = null
    private val log by logging<Client>()
    private var session by Delegates.notNull<DefaultWebSocketSession>()

    private val coroutineExceptionHandler = CoroutineExceptionHandler { ctx, t ->
        log.error("Exception in coroutine $ctx:", t)
    }

    var closed = false

    private suspend fun createMessageFlow() {
        log.debug("Creating event loop...")

        session.incoming.receiveAsFlow().collect {
            val raw = (it as? Frame.Text)?.readText() ?: error("Frame was not `Frame.Text`")
            val decoded = json.decodeFromString(JsonObject.serializer(), raw)

            onMessage(decoded, raw)
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
        } ?: throw ConnectException("Unable to read first message from connection: Connection closed.")

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

        session.send(Frame.Text(data))
    }

    suspend fun <T: Response> sendAndReceive(command: Command): T {
        val data = json.encodeToString(Command.Companion, command)
        log.trace("Sending data >> $data")

        session.send(Frame.Text(data))

        val resp = session.incoming.receive().readBytes().decodeToString()
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
