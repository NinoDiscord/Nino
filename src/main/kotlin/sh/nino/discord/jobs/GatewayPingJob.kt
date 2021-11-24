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

package sh.nino.discord.jobs

import dev.floofy.haru.abstractions.AbstractJob
import dev.kord.core.Kord
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import kotlinx.datetime.Clock
import kotlinx.serialization.Serializable
import sh.nino.discord.data.Config
import sh.nino.discord.kotlin.logging
import sh.nino.discord.modules.prometheus.PrometheusModule
import kotlin.time.Duration
import kotlin.time.ExperimentalTime

@Serializable
private data class InstatusAddMetricDatapointBody(
    val timestamp: Int,
    val value: Double
)

class GatewayPingJob(
    private val metrics: PrometheusModule,
    private val config: Config,
    private val httpClient: HttpClient,
    private val kord: Kord
): AbstractJob(name = "update:gateway:ping", expression = "1 * * * *") {
    private val logger by logging<GatewayPingJob>()

    @OptIn(ExperimentalTime::class)
    override suspend fun execute() {
        if (config.metrics) {
            logger.info("Uploading gateway ping to Prometheus...")

            val gateway = kord.gateway.averagePing ?: Duration.ZERO
            metrics.gatewayPing!!.observe(gateway.inWholeMilliseconds.toDouble())
        }

        if (config.instatus?.metricId != null) {
            logger.info("Uploading gateway ping to Instatus...")

            val res = httpClient.post<HttpResponse>("https://api.instatus.com/v1/pages/${config.instatus.pageId}/metrics/${config.instatus.metricId}") {
                header("Authorization", "Bearer ${config.instatus.apiKey}")
                body = InstatusAddMetricDatapointBody(
                    timestamp = Clock.System.now().toEpochMilliseconds().toInt(),
                    value = (kord.gateway.averagePing?.inWholeMilliseconds ?: Duration.ZERO.inWholeMilliseconds).toDouble()
                )
            }

            logger.info("Posted to Instatus - status: ${res.status}")
        }
    }
}
