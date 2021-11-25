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

package sh.nino.discord.core.ktor

import io.ktor.application.*
import io.ktor.http.*
import io.ktor.response.*
import io.ktor.routing.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.prometheus.client.exporter.common.TextFormat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import sh.nino.discord.data.Config
import sh.nino.discord.kotlin.logging
import sh.nino.discord.modules.prometheus.PrometheusModule
import java.io.StringWriter
import java.util.concurrent.TimeUnit

class NinoKtorServer(private val config: Config, private val prometheus: PrometheusModule) {
    private lateinit var server: NettyApplicationEngine
    private val logger by logging<NinoKtorServer>()

    suspend fun launch() {
        // Return nop if it is initialized already.
        if (this::server.isInitialized) return

        // Do not create the server if we don't intend to.
        if (config.server == null) {
            logger.warn("Not launching KTOR server due to being disabled.")
            return
        }

        logger.info("Launching KTOR server...")
        server = embeddedServer(Netty, port = config.server.port, host = config.server.host) {
            install(Routing) {
                get("/") {
                    call.respondText("{\"hello\":\"world\"}", ContentType.Application.Json, HttpStatusCode.OK)
                }

                get("/metrics") {
                    if (!config.metrics) {
                        call.respondText("{\"error\":\"Metrics is not enabled.\"}", ContentType.Application.Json, HttpStatusCode.OK)
                        return@get
                    }

                    // Create the metric string
                    val writer = StringWriter()
                    withContext(Dispatchers.IO) {
                        runCatching {
                            TextFormat.writeFormat("text/plain; version=0.0.4; charset=utf-8", writer, prometheus.registry!!.metricFamilySamples())
                        }
                    }

                    val result = writer.toString()
                    call.respondText(result, status = HttpStatusCode.OK, contentType = ContentType.Text.Plain)
                }
            }
        }

        server.start(wait = true)
    }

    fun close() {
        // No operation!
        if (!this::server.isInitialized) return

        logger.warn("Closing off KTOR server...")
        server.stop(1L, 10L, TimeUnit.MILLISECONDS)
    }
}
