package sh.nino.modules.timeouts

import gay.floof.utils.slf4j.logging
import io.ktor.client.*
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.serialization.json.Json
import sh.nino.modules.annotations.Action
import sh.nino.modules.annotations.Closeable
import sh.nino.modules.annotations.ModuleMeta
import sh.nino.modules.timeouts.types.Command
import sh.nino.modules.timeouts.types.Event
import sh.nino.modules.timeouts.types.Response

/**
 * The main module that can call the Timeouts microservice.
 */
@ModuleMeta(
    "timeouts",
    "The client implementation of Nino's timeouts microservice.",
    version = "2.0.0"
)
class TimeoutsModule(
    private val uri: String,
    private val auth: String?,
    private val httpClient: HttpClient,
    private val json: Json
) {
    private val log by logging<TimeoutsModule>()
    private lateinit var client: Client

    /**
     * Returns if the connection was already closed.
     */
    val closed: Boolean = if (::client.isInitialized) client.closed else true

    /**
     * Returns the event flow that can be called with [TimeoutsModule.on]!
     */
    val events = MutableSharedFlow<Event>(extraBufferCapacity = Int.MAX_VALUE)

    @OptIn(DelicateCoroutinesApi::class)
    @Action
    suspend fun init() {
        if (::client.isInitialized) {
            log.warn("TimeoutsModule.init/0 was already called, skipping.")
            return
        }

        client = Client(
            uri,
            auth ?: "",
            httpClient,
            GlobalScope,
            events,
            json,
            this
        )

        return client.connect()
    }

    @Closeable
    fun close() {
        // If it was already closed before, let's make it nop.
        if (closed) return

        // If the client wasn't initialized (probably an exception occurred),
        // this will be nop.
        if (!::client.isInitialized) {
            log.warn("Timeouts microservice connection was not established, skipping.")
            return
        }

        log.info("Closing off connection from timeouts microservice...")
        return client.close()
    }

    suspend fun send(command: Command) {
        if (closed) return
        if (!::client.isInitialized) return

        return client.send(command)
    }

    suspend fun <T: Response> sendAndReceive(command: Command): T? {
        if (closed) return null
        if (!::client.isInitialized) return null

        return client.sendAndReceive(command)
    }
}
