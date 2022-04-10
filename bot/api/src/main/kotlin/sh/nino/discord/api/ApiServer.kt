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

package sh.nino.discord.api

import gay.floof.utils.slf4j.logging
import io.ktor.application.*
import io.ktor.features.*
import io.ktor.routing.*
import io.ktor.serialization.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import org.koin.core.context.GlobalContext
import org.slf4j.LoggerFactory
import sh.nino.discord.api.middleware.ErrorHandling
import sh.nino.discord.api.middleware.Logging
import sh.nino.discord.api.middleware.ratelimiting.Ratelimiting
import sh.nino.discord.common.DEDI_NODE
import sh.nino.discord.common.NinoInfo
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.data.Environment
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.common.extensions.retrieveAll
import java.util.concurrent.TimeUnit

class ApiServer {
    private lateinit var server: NettyApplicationEngine
    private val log by logging<ApiServer>()

    suspend fun launch() {
        log.info("Launching API server...")

        val config = GlobalContext.retrieve<Config>()
        val environment = applicationEngineEnvironment {
            this.developmentMode = config.environment == Environment.Development
            this.log = LoggerFactory.getLogger("sh.nino.discord.api.ktor.Application")

            connector {
                host = config.api!!.host
                port = config.api!!.port
            }

            module {
                install(ErrorHandling)
                install(Ratelimiting)
                install(Logging)

                install(ContentNegotiation) {
                    json(GlobalContext.retrieve())
                }

                install(CORS) {
                    header("X-Forwarded-Proto")
                    anyHost()
                }

                install(DefaultHeaders) {
                    header("X-Powered-By", "Nino/DiscordBot (+https://github.com/NinoDiscord/Nino; ${NinoInfo.VERSION})")
                    header("Server", "Noelware${if (DEDI_NODE != "none") "/$DEDI_NODE" else ""}")
                }

                val endpoints = GlobalContext.retrieveAll<Endpoint>()
                log.info("Found ${endpoints.size} endpoints to register.")

                for (endpoint in endpoints) {
                    log.info("|- Found ${endpoint.routes.size} routes to implement.")
                    routing {
                        for (route in endpoint.routes) {
                            log.info("  \\- ${route.method.value} ${route.path}")

                            route(route.path, route.method) {
                                handle {
                                    try {
                                        return@handle route.execute(this.call)
                                    } catch (e: Exception) {
                                        log.error("Unable to handle request \"${route.method.value} ${route.path}\":", e)
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
            log.warn("Server was never initialized, skipping")
            return
        }

        val ratelimiter = server.application.featureOrNull(Ratelimiting)
        ratelimiter?.ratelimiter?.close()

        log.info("Dying off connections...")
        server.stop(1, 5, TimeUnit.SECONDS)
    }
}
