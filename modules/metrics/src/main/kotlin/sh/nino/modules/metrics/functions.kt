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

@file:JvmName("NinoMetricFunctionsKt")

package sh.nino.modules.metrics

import io.prometheus.client.Histogram
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

fun MetricsModule.inc(metricType: MetricType) {
    // nop if it's not enabled
    if (!enabled) return

    when (metricType) {
        MetricType.API_REQUEST_COUNT -> {
            if (apiEnabled) {
                apiRequestCount.inc()
            }
        }

        MetricType.COMMANDS_EXECUTED -> commandsExecuted.inc()
        MetricType.MESSAGES_SEEN -> messagesSeen.inc()
        MetricType.GUILD_COUNT -> guildCount.inc()
        else -> error("Metric type $metricType is not supported with inc method.")
    }
}

fun MetricsModule.dec(metricType: MetricType) {
    if (!enabled) return

    when (metricType) {
        MetricType.GUILD_COUNT -> guildCount.dec()
        else -> error("Metric type $metricType is not supported with dec method.")
    }
}

@OptIn(ExperimentalContracts::class)
suspend fun MetricsModule.measure(metricType: MetricType, block: suspend () -> Unit) {
    contract {
        callsInPlace(block, InvocationKind.EXACTLY_ONCE)
    }

    // If it's not enabled, just call the block
    // and not do anything.
    if (!enabled) {
        block()
        return
    }

    val histogram: Histogram = when (metricType) {
        MetricType.API_REQUEST_LATENCY -> if (apiEnabled) apiRequestLatency else null
        MetricType.COMMAND_LATENCY -> commandLatency
        else -> null
    } ?: return // nop it if not a histogram!

    val timer = histogram.startTimer()
    block()

    timer.observeDuration()
}

fun MetricsModule.incEvent(shard: Int, event: String) {
    if (!enabled) return

    websocketEvents.labels("$shard", event).inc()
}
