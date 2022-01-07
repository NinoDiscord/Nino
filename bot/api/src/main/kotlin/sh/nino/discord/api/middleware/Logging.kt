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

package sh.nino.discord.api.middleware

import gay.floof.utils.slf4j.logging
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.util.*
import io.ktor.util.pipeline.*
import io.prometheus.client.Histogram
import org.koin.core.context.GlobalContext
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.metrics.MetricsRegistry

class Logging {
    private val logger by logging<Logging>()

    companion object {
        val StartTimePhase = PipelinePhase("StartTimePhase")
        val LogResponsePhase = PipelinePhase("LogResponsePhase")

        val PrometheusObserver = AttributeKey<Histogram.Timer>("PrometheusObserver")
        val StartTimeKey = AttributeKey<Long>("StartTimeKey")

        object Plugin: ApplicationPlugin<Application, Unit, Logging> {
            override val key: AttributeKey<Logging> = AttributeKey("Logging")
            override fun install(pipeline: Application, configure: Unit.() -> Unit): Logging = Logging().apply {
                install(pipeline)
            }
        }
    }

    fun install(pipeline: Application) {
        pipeline.environment.monitor.subscribe(ApplicationStopped) {
            logger.warn("API has stopped completely. :3")
        }

        pipeline.addPhase(StartTimePhase)
        pipeline.intercept(StartTimePhase) {
            call.attributes.put(StartTimeKey, System.currentTimeMillis())
        }

        pipeline.addPhase(LogResponsePhase)
        pipeline.intercept(LogResponsePhase) {
            logResponse(call)
        }

        pipeline.intercept(ApplicationCallPipeline.Setup) {
            // Set up the histogram, if metrics is enabled
            val metrics = GlobalContext.retrieve<MetricsRegistry>()
            if (metrics.enabled) {
                val timer = metrics.apiRequestLatency!!.startTimer()
                call.attributes.put(PrometheusObserver, timer)
            }
        }
    }

    private suspend fun logResponse(call: ApplicationCall) {
        val time = System.currentTimeMillis() - call.attributes[StartTimeKey]
        val status = call.response.status()!!
        val body = call.receive<ByteArray>()
        val timer = call.attributes.getOrNull(PrometheusObserver)

        timer?.observeDuration()
        logger.info("${status.value} ${status.description} - ${call.request.httpMethod.value} ${call.request.path()} (~${time}ms, ${body.size} bytes written)")
    }
}
