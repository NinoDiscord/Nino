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
import io.ktor.application.*
import io.ktor.http.*
import io.ktor.request.*
import io.ktor.util.*
import io.ktor.util.pipeline.*
import io.prometheus.client.Histogram
import org.koin.core.context.GlobalContext
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.metrics.MetricsRegistry

class Logging {
    private val log by logging<Logging>()
    private val startTimePhase = PipelinePhase("StartTimePhase")
    private val logResponsePhase = PipelinePhase("LogResponsePhase")
    private val prometheusObserver = AttributeKey<Histogram.Timer>("PrometheusObserver")
    private val startTimeKey = AttributeKey<Long>("StartTimeKey")

    private fun install(pipeline: Application) {
        pipeline.environment.monitor.subscribe(ApplicationStopped) {
            log.warn("API has completely halted.")
        }

        pipeline.addPhase(startTimePhase)
        pipeline.intercept(startTimePhase) {
            call.attributes.put(startTimeKey, System.currentTimeMillis())
        }

        pipeline.addPhase(logResponsePhase)
        pipeline.intercept(logResponsePhase) {
            logResponse(call)
        }

        pipeline.intercept(ApplicationCallPipeline.Setup) {
            val metrics = GlobalContext.retrieve<MetricsRegistry>()
            if (metrics.enabled) {
                val timer = metrics.apiRequestLatency!!.startTimer()
                call.attributes.put(prometheusObserver, timer)
            }
        }
    }

    private suspend fun logResponse(call: ApplicationCall) {
        val time = System.currentTimeMillis() - call.attributes[startTimeKey]
        val status = call.response.status()!!
        val body = call.receive<ByteArray>()
        val timer = call.attributes.getOrNull(prometheusObserver)

        timer?.observeDuration()
        log.info("${status.value} ${status.description} - ${call.request.httpMethod.value} ${call.request.path()} (${body.size} bytes written) [${time}ms]")
    }

    companion object: ApplicationFeature<Application, Unit, Logging> {
        override val key: AttributeKey<Logging> = AttributeKey("Logging")
        override fun install(pipeline: Application, configure: Unit.() -> Unit): Logging = Logging().apply { install(pipeline) }
    }
}
