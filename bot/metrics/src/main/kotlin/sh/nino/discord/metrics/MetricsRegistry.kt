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

package sh.nino.discord.metrics

import gay.floof.utils.slf4j.logging
import io.prometheus.client.CollectorRegistry
import io.prometheus.client.Counter
import io.prometheus.client.Gauge
import io.prometheus.client.Histogram
import io.prometheus.client.hotspot.DefaultExports
import sh.nino.discord.common.data.Config

class MetricsRegistry(config: Config) {
    private val logger by logging<MetricsRegistry>()
    val enabled: Boolean = config.metrics

    val commandsExecutedGauge: Gauge?
    val commandLatency: Histogram?
    val gatewayPing: Gauge?
    val messagesSeen: Counter?
    val gatewayLatency: Gauge?
    val apiRequestLatency: Histogram?
    val apiRequests: Gauge?
    val registry: CollectorRegistry?
    val users: Gauge?
    val guildCount: Gauge?
    val websocketEvents: Counter?

    init {
        if (enabled) {
            logger.info("Metrics is enabled, you will be able to collect them from the API endpoint /metrics")
            registry = CollectorRegistry()

            // Export JVM metrics cuz cool and good
            DefaultExports.register(registry)

            // Export our own!
            commandsExecutedGauge = Gauge.build()
                .name("nino_commands_executed")
                .help("Returns how many commands were executed during its lifetime.")
                .register(registry)

            commandLatency = Histogram.build()
                .name("nino_command_latency")
                .help("Returns the latency in milliseconds of how long a command is executed.")
                .labelNames("command")
                .register(registry)

            gatewayLatency = Gauge.build()
                .name("nino_gateway_latency")
                .help("Returns the gateway latency per shard. Use the `gatewayPing` gauge for all shards combined.")
                .labelNames("shard")
                .register(registry)

            gatewayPing = Gauge.build()
                .name("nino_gateway_ping")
                .help("Returns the gateway latency for all shards.")
                .register(registry)

            messagesSeen = Counter.build()
                .name("nino_messages_seen")
                .help("Returns how many messages Nino has seen.")
                .register(registry)

            guildCount = Gauge.build()
                .name("nino_guild_count")
                .help("Returns how many guilds Nino is in")
                .register(registry)

            users = Gauge.build()
                .name("nino_user_count")
                .help("Returns how many users Nino can see")
                .register(registry)

            websocketEvents = Counter.build()
                .name("nino_websocket_events")
                .help("Returns how many events that are being emitted.")
                .labelNames("shard", "event")
                .register(registry)

            if (config.api != null) {
                apiRequestLatency = Histogram.build()
                    .name("nino_api_request_latency")
                    .help("Returns the average latency on all API requests.")
                    .register(registry)

                apiRequests = Gauge.build()
                    .name("nino_api_request_count")
                    .help("Returns how many requests by endpoint + method have been executed.")
                    .labelNames("endpoint", "method")
                    .register(registry)
            } else {
                apiRequests = null
                apiRequestLatency = null
            }
        } else {
            logger.warn("Metrics is not available on this instance.")

            registry = null
            commandsExecutedGauge = null
            commandLatency = null
            gatewayLatency = null
            gatewayPing = null
            messagesSeen = null
            apiRequests = null
            apiRequestLatency = null
            users = null
            guildCount = null
            websocketEvents = null
        }
    }
}
