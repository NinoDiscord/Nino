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

package sh.nino.core.jobs

import dev.kord.core.Kord
import gay.floof.utils.slf4j.logging
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.serialization.Serializable
import sh.nino.commons.data.Config
import sh.nino.core.timers.Job
import sh.nino.modules.Registry
import sh.nino.modules.metrics.MetricsModule
import kotlin.time.Duration
import kotlin.time.DurationUnit

@Serializable
data class InstatusPostMetricBody(
    val timestamp: Long,
    val value: Long
)

class GatewayPingJob(
    private val config: Config,
    private val httpClient: HttpClient,
    private val kord: Kord
): Job(
    "gateway.ping",
    5000
) {
    private val metrics: MetricsModule? by Registry.inject()
    private val log by logging<GatewayPingJob>()

    override suspend fun execute() {
        if (metrics?.enabled == true) {
            val averagePing = kord.gateway.averagePing ?: Duration.ZERO
            metrics?.gatewayLatency?.observe(averagePing.inWholeMilliseconds.toDouble())

            // Log the duration for all shards
            for ((shardId, shard) in kord.gateway.gateways) {
                metrics?.gatewayPing?.labels("$shardId")?.observe((shard.ping.value ?: Duration.ZERO).inWholeMilliseconds.toDouble())
            }
        }

        if (config.instatus != null && config.instatus?.gatewayMetricId != null) {
            log.debug("Instatus configuration is available, now posting to Instatus...")
            val res: HttpResponse = httpClient.post("https://api.instatus.com/v1/${config.instatus!!.pageId}/metrics/${config.instatus!!.gatewayMetricId}") {
                setBody(
                    InstatusPostMetricBody(
                        timestamp = System.currentTimeMillis(),
                        value = (kord.gateway.averagePing ?: Duration.ZERO).toLong(DurationUnit.MILLISECONDS)
                    )
                )

                header("Authorization", config.instatus!!.token)
            }

            if (!res.status.isSuccess()) {
                log.warn("Unable to post to Instatus (${res.status.value} ${res.status.description}): ${res.body<String>()}")
            }
        }
    }
}
