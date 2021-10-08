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

package sh.nino.discord.modules.clustering

import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.features.*
import io.ktor.client.features.json.*
import io.ktor.client.features.json.serializer.*
import io.ktor.client.features.websocket.*
import io.ktor.http.cio.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import sh.nino.discord.NinoBot
import sh.nino.discord.NinoInfo
import sh.nino.discord.core.NinoScope
import sh.nino.discord.data.Config
import sh.nino.discord.data.Environment
import sh.nino.discord.kotlin.logging
import sh.nino.discord.modules.clustering.types.DataPacket
import kotlin.coroutines.CoroutineContext
import kotlin.properties.Delegates

class ClusteringModule(private val config: Config, private val json: Json): CoroutineScope, AutoCloseable {
    private val wsClient: HttpClient = HttpClient(OkHttp) {
        engine {
            config {
                followRedirects(true)
            }
        }

        install(JsonFeature) {
            serializer = KotlinxSerializer(json)
        }

        install(UserAgent) {
            agent = "Nino/DiscordBot (+https://github.com/NinoDiscord/Nino; v${NinoInfo.VERSION})"
        }

        install(WebSockets) {
            developmentMode = config.environment == Environment.Development
        }
    }

    private lateinit var heartbeatJob: Job
    private lateinit var messageJob: Job
    private var defaultSession: DefaultClientWebSocketSession by Delegates.notNull()
    private val pings: MutableList<Long> = mutableListOf()
    private val stopEvent = CompletableDeferred<Unit>()
    private val heartbeatDeferred = CompletableDeferred<Unit>()
    private val logger by logging<ClusteringModule>()

    override val coroutineContext: CoroutineContext = SupervisorJob() + NinoBot.executorPool.asCoroutineDispatcher()
    private val handleCoroutineException = CoroutineExceptionHandler { job, t ->
        logger.error("Exception in coroutine job $job has occurred:", t)
    }

    override fun close() {
        logger.warn("Told to disconnect from WebSocket")
        stopEvent.complete(Unit)
    }

    @OptIn(InternalCoroutinesApi::class)
    internal suspend fun messageReceiveLoop() {
        defaultSession.incoming.receiveAsFlow().collect {
            val data = (it as Frame.Text).readText()
            val blob = json.decodeFromString(DataPacket.serializer(), data)

            NinoScope.launch(handleCoroutineException) {
                dispatch(blob, data)
            }
        }
    }

    private suspend fun dispatch(packet: DataPacket, raw: String) {
        logger.trace("Received packet $packet")
    }
}

/*
    private suspend fun dispatch(data: Event, raw: String) {
        logger.trace("Received data packet %o", data)
        when (data.type) {
            EventType.Ready -> {
                val event = kairi.builder.json.decodeFromString(ReadyEvent.serializer(), raw)

                kairi.selfUser = event.users.first()
                logger.info("We have launched and received a stable connection! Hello ${kairi.selfUser.username} <3")
                eventFlow.emit(event)

                // populate server cache
                // TODO: server cache
            }

            EventType.Pong -> {
                lastReceivedAt = Instant.now().toEpochMilli()

                val ping = lastReceivedAt!! - lastAckedAt!!
                logger.info("Received a heartbeat. Ping is now at ~${ping}ms")
                hasAcked.complete(Unit)
            }

            EventType.Null -> {
                logger.error("Received `null` packet type, cannot do anything. :(")
            }
        }
    }
 */
