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
import io.ktor.http.*
import io.ktor.serialization.kotlinx.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import org.koin.core.context.GlobalContext
import org.slf4j.LoggerFactory
import sh.nino.discord.api.middleware.ErrorHandling
import sh.nino.discord.api.middleware.Logging
import sh.nino.discord.api.middleware.ratelimiting.Ratelimiting
import sh.nino.discord.common.NinoInfo
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.data.Environment
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.common.extensions.retrieveAll
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
                install(ErrorHandling.Plugin)
                install(Logging.Companion.Plugin)
                install(Ratelimiting)

                install(ContentNegotiation) {
                    serialization(ContentType.Application.Json, GlobalContext.retrieve<Json>())
                }

                install(CORS) {
                    header("X-Forwarded-Proto")
                    anyHost()
                }

                install(DefaultHeaders) {
                    header("X-Powered-By", "Nino/DiscordBot (+https://github.com/NinoDiscord/Nino; ${NinoInfo.VERSION})")
                    header("Server", "Noelware")
                }

                val endpoints = GlobalContext.retrieveAll<Endpoint>()
                for (endpoint in endpoints) {
                    logger.info("Found ${endpoint.routes.size} routes from endpoint ${endpoint.prefix}")
                    for (route in endpoint.routes) {
                        routing {
                            route(route.path, route.method) {
                                handle {
                                    try {
                                        route.execute(this.call)
                                    } catch (e: Exception) {
                                        this@ApiServer.logger.error("Unable to handle request to ${route.method.value} ${route.path}:", e)
                                        return@handle call.respondText(
                                            ContentType.Application.Json,
                                            HttpStatusCode.InternalServerError
                                        ) {
                                            Json.encodeToString(
                                                JsonObject.serializer(),
                                                JsonObject(
                                                    mapOf(
                                                        "message" to JsonPrimitive("Unable to handle request at this time.")
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

    suspend fun shutdown() {
        if (!::server.isInitialized) {
            logger.warn("Server was never initialized, skipping")
            return
        }

        val ratelimiter = server.application.plugin(Ratelimiting).ratelimiter
        ratelimiter.close()

        logger.info("Dying off connections...")
        server.stop(1, 5, TimeUnit.SECONDS)
    }
}
