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

package sh.nino.discord.clustering

import io.ktor.client.*
import io.ktor.client.features.websocket.*
import io.ktor.client.request.*
import io.ktor.http.cio.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import sh.nino.discord.clustering.types.DataPacket
import sh.nino.discord.clustering.types.OPType
import sh.nino.discord.clustering.types.ShardDataPacket
import sh.nino.discord.core.NinoScope
import sh.nino.discord.core.threading.NamedThreadFactory
import sh.nino.discord.data.Config
import sh.nino.discord.extensions.asJson
import sh.nino.discord.kotlin.logging
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.coroutines.CoroutineContext
import kotlin.properties.Delegates
import kotlin.time.Duration
import kotlin.time.ExperimentalTime

@OptIn(ExperimentalTime::class)
class ClusterOperator(
    private val config: Config,
    private val httpClient: HttpClient,
    private val json: Json
): CoroutineScope, AutoCloseable {
    private val executorPool: ExecutorService = Executors.newCachedThreadPool(NamedThreadFactory("ClusterOperator"))
    private var heartbeatJob: Job? = null
    private var messageQueueJob: Job? = null
    private var defaultWsSession: DefaultClientWebSocketSession by Delegates.notNull()
    private var heartbeatDeferred = CompletableDeferred<Unit>()
    private var stopEvent = CompletableDeferred<Unit>()
    private var lastReceivedAt: Instant? = null
    private var lastAckedAt: Instant? = null
    private val logger by logging<ClusterOperator>()

    override val coroutineContext: CoroutineContext = SupervisorJob() + executorPool.asCoroutineDispatcher()
    private val errorHandler = CoroutineExceptionHandler { job, t ->
        logger.error("Exception was thrown in coroutine job $job:", t)
    }

    @OptIn(InternalCoroutinesApi::class)
    internal suspend fun receiveWebSocketMessageLoop() {
        defaultWsSession.incoming.receiveAsFlow().collect {
            val data = (it as Frame.Text).readText()
            val packet = json.decodeFromString(DataPacket.serializer(), data)

            NinoScope.launch(errorHandler) {
                dispatchPacket(data, packet)
            }
        }
    }

    override fun close() {
        logger.warn("Closing WebSocket connection towards cluster operator...")
        stopEvent.complete(Unit)
    }

    private suspend fun dispatchPacket(
        raw: String,
        data: DataPacket
    ) {
        logger.debug("Raw data:", raw)
        when (data.type) {
            OPType.Ready -> {
                logger.info("Received `READY` packet from server.")
            }

            OPType.HeartbeatAck -> {
                lastReceivedAt = Clock.System.now()
                logger.debug("Received heartbeat from server, ping: ~${lastReceivedAt!!.toEpochMilliseconds() - lastAckedAt!!.toEpochMilliseconds()}ms")
            }

            else -> {
                logger.warn("Received unknown op type.")
            }
        }
    }

    private suspend fun heartbeatLoop() {
        while (true) {
            delay(Duration.Companion.seconds(30))
            defaultWsSession.send(
                JsonObject(
                    mapOf(
                        "type" to 3.asJson()
                    )
                ).toString()
            )

            lastAckedAt = Clock.System.now()
            heartbeatDeferred.await()
        }
    }

    suspend fun launch() {
        logger.info("Connecting towards cluster operator...")
        httpClient.ws(
            "ws://${config.clustering?.host ?: "localhost"}:${config.clustering?.port ?: 3010}/ws",
            {
                header("Authorization", config.clustering?.auth)
            }
        ) {
            logger.info("Connected to WebSocket using URI - 'ws://${config.clustering?.host ?: "localhost"}:${config.clustering?.port ?: 3010}/ws'")
            defaultWsSession.send("{\"type\":0}")

            logger.info("If this was successful, you should see the gateway connecting...")
            val message = incoming.receive().readBytes().decodeToString()
            val shardData = json.decodeFromString(ShardDataPacket.serializer(), message)

            messageQueueJob = NinoScope.launch(errorHandler) {
                receiveWebSocketMessageLoop()
            }

            heartbeatJob = NinoScope.launch(errorHandler) {
                heartbeatLoop()
            }

            stopEvent.await()

            logger.warn("Told to disconnect from server.")
            messageQueueJob?.cancelAndJoin()
            heartbeatJob?.cancelAndJoin()
        }
    }
}
