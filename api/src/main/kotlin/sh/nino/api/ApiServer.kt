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

package sh.nino.api

import gay.floof.utils.slf4j.logging
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.autohead.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.sentry.Sentry
import kotlinx.serialization.json.*
import org.koin.core.context.GlobalContext
import org.slf4j.LoggerFactory
import org.slf4j.event.Level
import sh.nino.api.plugins.KtorLoggingPlugin
import sh.nino.commons.NinoInfo
import sh.nino.commons.data.Config
import sh.nino.commons.data.Environment
import sh.nino.commons.extensions.inject
import sh.nino.commons.extensions.retrieveAll

/**
 * Represents the API server that is in the background if `config.api` is not null.
 */
class ApiServer(private val config: Config) {
    private lateinit var server: NettyApplicationEngine
    private val log by logging<ApiServer>()

    suspend fun launch() {
        log.info("Starting API service...")

        val apiConfig = config.api!!
        val self = this // so i don't have to `this@ApiServer.config`...
        val environment = applicationEngineEnvironment {
            this.developmentMode = self.config.environment == Environment.Development
            this.log = LoggerFactory.getLogger("sh.nino.api.ktor.KtorService")

            connector {
                host = apiConfig.host
                port = apiConfig.port
            }

            module {
                val json: Json by inject()

                install(KtorLoggingPlugin)
                install(AutoHeadResponse)
                install(CallLogging) {
                    level = if (self.config.environment == Environment.Development) {
                        Level.DEBUG
                    } else {
                        Level.INFO
                    }

                    mdc("user-agent") {
                        val userAgent = it.request.userAgent()
                        userAgent
                    }
                }

                install(ContentNegotiation) {
                    this.json(json)
                }

                install(CORS) {
                    anyHost()
                    headers += "X-Forwarded-Proto"
                }

                // Install some default headers uwu
                install(DefaultHeaders) {
                    header("X-Powered-By", "Nino/API (+https://github.com/NinoDiscord/tree/master/api; v${NinoInfo.VERSION})")
                    header("Cache-Control", "public, max-age=7776000")

                    if (apiConfig.securityHeaders) {
                        header("X-Frame-Options", "deny")
                        header("X-Content-Type-Options", "nosniff")
                        header("X-XSS-Protection", "1; mode=block")
                    }

                    for ((key, value) in apiConfig.extraHeaders) {
                        header(key, value)
                    }
                }

                install(StatusPages) {
                    // If the route was not found
                    status(HttpStatusCode.NotFound) { call, _ ->
                        call.respond(
                            HttpStatusCode.NotFound,
                            buildJsonObject {
                                put("success", false)
                                put(
                                    "errors",
                                    buildJsonArray {
                                        add(
                                            buildJsonObject {
                                                put("message", "Route ${call.request.httpMethod.value} ${call.request.uri} was not found.")
                                                put("code", "UNKNOWN_ROUTE")
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    }

                    exception<Exception> { call, cause ->
                        if (Sentry.isEnabled()) {
                            Sentry.captureException(cause)
                        }

                        this@ApiServer.log.error("Unable to handle request ${call.request.httpMethod.value} ${call.request.uri}:", cause)
                        call.respond(
                            HttpStatusCode.InternalServerError,
                            buildJsonObject {
                                put("success", false)
                                put(
                                    "errors",
                                    buildJsonArray {
                                        add(
                                            buildJsonObject {
                                                put("message", "Unknown exception has occured")
                                                put("code", "INTERNAL_SERVER_ERROR")

                                                if (self.config.environment == Environment.Development) {
                                                    put(
                                                        "detail",
                                                        buildJsonObject {
                                                            put("message", cause.message ?: cause.localizedMessage)
                                                            put(
                                                                "stacktrace",
                                                                buildJsonArray {
                                                                    for (stacktrace in cause.stackTrace) {
                                                                        println(stacktrace)
                                                                    }
                                                                }
                                                            )

                                                            if (cause.cause != null) {
                                                                put("caused_by", cause.cause!!.message ?: cause.cause!!.localizedMessage)
                                                            }
                                                        }
                                                    )
                                                }
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    }
                }

                routing {
                    val endpoints = GlobalContext.retrieveAll<Any>()
                }
            }
        }
    }
}

/*
            module {
                routing {
                    val endpoints = koin.getAll<AbstractEndpoint>()
                    log.info("Found ${endpoints.size} endpoints to register.")

                    for (endpoint in endpoints) {
                        val pathMethodPair = Pair(endpoint.path, endpoint.method)
                        if (routesRegistered.contains(pathMethodPair))
                            continue

                        routesRegistered.add(pathMethodPair)
                        log.info("Registering endpoint ${endpoint.method.value} ${endpoint.path}")
                        route(endpoint.path, endpoint.method) {
                            handle {
                                val metrics: MetricsHandler by inject()
                                metrics.requestsCount?.labels(endpoint.path, endpoint.method.value)?.inc()

                                endpoint.call(call)
                            }
                        }
                    }

                    log.info("Registered all endpoints! Now registering Discord Interactions...")
                    installDiscordInteractions(
                        config.publicKey,
                        "/api/interactions",
                        DefaultInteractionRequestHandler(applicationId, commandManager, restClient)
                    )
                }
            }
        }

        server = embeddedServer(
            Netty,
            environment,
            configure = {
                requestQueueLimit = config.server.requestQueueLimit
                runningLimit = config.server.runningLimit
                shareWorkGroup = config.server.shareWorkGroup
                responseWriteTimeoutSeconds = config.server.responseWriteTimeoutSeconds
                requestReadTimeoutSeconds = config.server.requestReadTimeout
                tcpKeepAlive = config.server.tcpKeepAlive
            }
        )

        if (!config.server.securityHeaders)
            log.warn("It is not recommended to disable security headers when requesting to the API. :)")

        server.start(wait = true)
 */
