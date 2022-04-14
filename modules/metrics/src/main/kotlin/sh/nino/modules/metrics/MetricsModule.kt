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

package sh.nino.modules.metrics

import io.prometheus.client.CollectorRegistry
import io.prometheus.client.Counter
import io.prometheus.client.Gauge
import io.prometheus.client.Histogram
import io.prometheus.client.hotspot.DefaultExports
import sh.nino.modules.annotations.Action
import sh.nino.modules.annotations.ModuleMeta

@ModuleMeta("metrics", "Enables the use of Prometheus to scrape metrics out of the bot.", version = "2.0.0")
class MetricsModule(val enabled: Boolean, val apiEnabled: Boolean) {
    lateinit var apiRequestLatency: Histogram
    lateinit var commandsExecuted: Counter
    lateinit var apiRequestCount: Gauge
    lateinit var websocketEvents: Counter
    lateinit var commandLatency: Histogram
    lateinit var messagesSeen: Counter
    lateinit var gatewayLatency: Histogram
    lateinit var gatewayPing: Histogram
    lateinit var guildCount: Gauge
    lateinit var registry: CollectorRegistry
    lateinit var users: Gauge

    @Action
    @Suppress("UNUSED")
    fun onInit() {
        if (enabled) {
            // Use a custom registry uwu
            registry = CollectorRegistry()

            // Export JVM metrics cuz cool and good
            DefaultExports.register(registry)

            commandsExecuted = Counter.build()
                .name("nino_commands_executed")
                .help("Returns how many commands were executed during its lifetime.")
                .register(registry)

            commandLatency = Histogram.build()
                .name("nino_command_latency")
                .help("Returns the latency in milliseconds of how long a command is executed.")
                .labelNames("command")
                .register(registry)

            gatewayLatency = Histogram.build()
                .name("nino_gateway_latency")
                .help("Returns the gateway latency per shard. Use the `gatewayPing` gauge for all shards combined.")
                .labelNames("shard")
                .register(registry)

            gatewayPing = Histogram.build()
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

            if (apiEnabled) {
                apiRequestLatency = Histogram.build()
                    .name("nino_api_request_latency")
                    .help("Returns the average latency on all API requests.")
                    .register(registry)

                apiRequestCount = Gauge.build()
                    .name("nino_api_request_count")
                    .help("Returns how many requests by endpoint + method have been executed.")
                    .labelNames("endpoint", "method")
                    .register(registry)
            }
        }
    }
}
