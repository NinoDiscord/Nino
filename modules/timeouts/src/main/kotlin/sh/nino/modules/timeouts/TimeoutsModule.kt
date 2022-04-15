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
import io.sentry.Sentry
import io.sentry.kotlin.SentryContext
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.*
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import sh.nino.modules.annotations.Action
import sh.nino.modules.annotations.Closeable
import sh.nino.modules.annotations.ModuleMeta
import sh.nino.modules.timeouts.types.Command
import sh.nino.modules.timeouts.types.Event
import sh.nino.modules.timeouts.types.Response
import kotlin.coroutines.CoroutineContext

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
    lateinit var client: Client

    /**
     * Returns if the connection was already closed.
     */
    val closed: Boolean = if (::client.isInitialized) client.closed else true

    /**
     * Returns the event flow that can be called with [TimeoutsModule.on]!
     */
    val events = MutableSharedFlow<Event>(extraBufferCapacity = Int.MAX_VALUE)

    @OptIn(DelicateCoroutinesApi::class)
    @Suppress("UNUSED")
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
            json
        )

        // Create a new coroutine scope for this, so it doesn't
        // block the main thread :>
        GlobalScope.launch {
            client.connect()
        }
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

@OptIn(DelicateCoroutinesApi::class)
inline fun <reified T: Event> TimeoutsModule.on(scope: CoroutineScope = client, noinline consume: suspend T.() -> Unit): Job =
    events.buffer(Channel.UNLIMITED).filterIsInstance<T>()
        .onEach { event ->
            val ctx: CoroutineContext = if (Sentry.isEnabled()) {
                SentryContext() + GlobalScope.coroutineContext
            } else {
                GlobalScope.coroutineContext
            }

            scope.launch(ctx) {
                kotlin.runCatching {
                    consume(event)
                }.onFailure {
                    val log = LoggerFactory.getLogger(TimeoutsModule::class.java)
                    log.error("Unable to run event ${event::class}:", it)
                }
            }
        }.launchIn(scope)
