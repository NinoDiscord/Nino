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

package sh.nino.discord.api

import gay.floof.utils.slf4j.logging
import io.ktor.application.*
import io.ktor.features.*
import io.ktor.http.*
import io.ktor.metrics.micrometer.*
import io.ktor.response.*
import io.ktor.routing.*
import io.ktor.serialization.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.micrometer.core.instrument.binder.jvm.JvmGcMetrics
import io.micrometer.core.instrument.binder.jvm.JvmMemoryMetrics
import io.micrometer.core.instrument.binder.jvm.JvmThreadMetrics
import io.micrometer.core.instrument.binder.system.ProcessorMetrics
import io.micrometer.prometheus.PrometheusMeterRegistry
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import org.koin.core.context.GlobalContext
import org.slf4j.LoggerFactory
import org.slf4j.event.Level
import sh.nino.discord.common.NinoInfo
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.data.Environment
import sh.nino.discord.common.extensions.retrieve
import java.util.concurrent.TimeUnit

class ApiServer {
    private lateinit var server: NettyApplicationEngine
    private val logger by logging<ApiServer>()

    suspend fun launch() {
        logger.info("Starting up API server...")

        val config = GlobalContext.retrieve<Config>()
        val environment = applicationEngineEnvironment {
            this.developmentMode = config.environment == Environment.Development
            this.log = LoggerFactory.getLogger("sh.nino.discord.api.server.Application")

            connector {
                host = config.api!!.host
                port = config.api!!.port
            }

            module {
                install(CallLogging) {
                    level = if (config.environment == Environment.Development) {
                        Level.DEBUG
                    } else {
                        Level.INFO
                    }
                }

                install(ContentNegotiation) {
                    json(GlobalContext.retrieve())
                }

                install(DefaultHeaders) {
                    header("X-Powered-By", "Nino/DiscordBot (+https://github.com/NinoDiscord/Nino; ${NinoInfo.VERSION})")
                    header("Server", "cute furries doing cute things >~< (https://floof.gay)")
                }

                install(CORS) {
                    header(HttpHeaders.XForwardedProto)
                    anyHost()
                }

                if (config.metrics) {
                    val registry = GlobalContext.retrieve<PrometheusMeterRegistry>()
                    install(MicrometerMetrics) {
                        this.registry = registry
                        meterBinders = listOf(
                            JvmMemoryMetrics(),
                            JvmGcMetrics(),
                            ProcessorMetrics(),
                            JvmThreadMetrics()
                        )
                    }
                }

                val endpoints = GlobalContext.get().getAll<Endpoint>()
                for (endpoint in endpoints) {
                    logger.info("Found ${endpoint.routes.size} routes from endpoint ${endpoint.prefix}! (${endpoint::class})")
                    for (route in endpoint.routes) {
                        logger.info("Registering route ${route.method.value} ${route.path} from endpoint ${endpoint.prefix}")
                        routing {
                            route(route.path, route.method) {
                                handle {
                                    try {
                                        route.execute(this.call)
                                    } catch (e: Exception) {
                                        this@ApiServer.logger.error("Unable to handle request:", e)
                                        return@handle call.respondText(
                                            contentType = ContentType.Application.Json,
                                            status = HttpStatusCode.InternalServerError
                                        ) {
                                            Json.encodeToString(
                                                JsonObject.serializer(),
                                                JsonObject(
                                                    mapOf(
                                                        "message" to JsonPrimitive("Unable to handle request.")
                                                    )
                                                )
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        server = embeddedServer(Netty, environment)
        server.start(wait = true)
    }

    fun shutdown() {
        if (!::server.isInitialized) {
            logger.warn("Server was never initialized, skipping")
            return
        }

        logger.info("Dying off connections...")
        server.stop(1, 5, TimeUnit.SECONDS)
    }
}
