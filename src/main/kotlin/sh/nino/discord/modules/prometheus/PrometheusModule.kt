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

package sh.nino.discord.modules.prometheus

import io.prometheus.client.CollectorRegistry
import io.prometheus.client.Counter
import io.prometheus.client.Gauge
import io.prometheus.client.Histogram
import io.prometheus.client.hotspot.DefaultExports
import sh.nino.discord.data.Config
import sh.nino.discord.kotlin.logging

class PrometheusModule(config: Config) {
    private val logger by logging<PrometheusModule>()
    private val registry: CollectorRegistry?

    val commandLatency: Histogram?
    var gatewayPing: Histogram?
    val commandsExecuted: Counter?
    val messagesSeen: Counter?
    val shardLatency: Gauge?

    init {
        if (config.metrics) {
            logger.info("Metrics are enabled! Enabling registry...")

            registry = CollectorRegistry(true)
            DefaultExports.register(registry)

            commandLatency = Histogram
                .build()
                .name("nino_command_latency")
                .labelNames("command")
                .help("Returns the average latency of a command's execution.")
                .register(registry)

            gatewayPing = Histogram
                .build()
                .name("nino_gateway")
                .help("Returns the average latency of all gateway shards.")
                .register(registry)

            commandsExecuted = Counter
                .build()
                .name("nino_commands_executed")
                .help("Returns how many commands were executed during its lifetime.")
                .register(registry)

            messagesSeen = Counter
                .build()
                .name("nino_messages_seen")
                .help("Returns how many messages Nino has seen.")
                .register(registry)

            shardLatency = Gauge
                .build()
                .name("nino_shard_latency")
                .labelNames("shard_id")
                .help("Returns the average latency of a shard.")
                .register(registry)
        } else {
            logger.info("Metrics are not enabled.")

            registry = null
            shardLatency = null
            commandLatency = null
            commandsExecuted = null
            gatewayPing = null
            messagesSeen = null
        }
    }
}
