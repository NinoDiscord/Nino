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
    val commandsExecuted: Counter?
    val messagesSeen: Counter?
    val websocketEvents: Counter?
    val shardLatency: Gauge?

    val enabled: Boolean = config.metrics

    init {
        if (enabled) {
            logger.info("Metrics are enabled! Enabling registry...")

            registry = CollectorRegistry(true)
            DefaultExports.register(registry)

            commandLatency = Histogram
                .build()
                .name("nino_command_latency")
                .labelNames("command")
                .help("Returns the average latency of a command's execution.")
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

            websocketEvents = Counter
                .build()
                .name("nino_websocket_events")
                .labelNames("event", "shard")
                .help("How many events are being emitted per shard.")
                .register(registry)
        } else {
            logger.info("Metrics are not enabled.")

            registry = null
            shardLatency = null
            commandLatency = null
            commandsExecuted = null
            messagesSeen = null
            websocketEvents = null
        }
    }
}
