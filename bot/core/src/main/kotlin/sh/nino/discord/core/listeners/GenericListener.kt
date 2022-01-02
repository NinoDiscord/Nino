package sh.nino.discord.core.listeners

import dev.kord.common.entity.ActivityType
import dev.kord.common.entity.PresenceStatus
import dev.kord.core.Kord
import dev.kord.core.event.gateway.DisconnectEvent
import dev.kord.core.event.gateway.ReadyEvent
import dev.kord.core.on
import org.koin.core.context.GlobalContext
import org.slf4j.LoggerFactory
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.core.NinoBot
import sh.nino.discord.common.data.Config

fun Kord.applyGenericEvents() {
    val logger = LoggerFactory.getLogger("sh.nino.discord.core.listeners.GenericListenerKt")

    on<ReadyEvent> {
        logger.info("Successfully launched bot as ${this.self.tag} (${this.self.id}) in shard #${this.shard}")
        logger.info("Ready in ${this.guilds.size} guilds! | Using Gateway v${this.gatewayVersion}")
        logger.info("Launched in ${System.currentTimeMillis() - GlobalContext.retrieve<NinoBot>().bootTime}ms")

        val config = GlobalContext.retrieve<Config>()
        val currStatus = config.status.status
            .replace("{shard_id}", this.shard.toString())
            .replace("{guilds}", this.guilds.size.toString())

        kord.editPresence {
            status = config.status.presence
            when (config.status.type) {
                ActivityType.Listening -> listening(currStatus)
                ActivityType.Game -> playing(currStatus)
                ActivityType.Competing -> competing(currStatus)
                ActivityType.Watching -> watching(currStatus)
                else -> {
                    playing(currStatus)
                }
            }
        }
    }

    on<DisconnectEvent> {
        val reason = buildString {
            if (this@on is DisconnectEvent.DetachEvent)
                append("Shard #${this@on.shard} has been detached.")

            if (this@on is DisconnectEvent.UserCloseEvent)
                append("Closed by you.")

            if (this@on is DisconnectEvent.TimeoutEvent)
                append("Possible internet connection loss; something was timed out. :<")

            if (this@on is DisconnectEvent.DiscordCloseEvent) {
                val event = this@on
                append("Discord closed off our connection (${event.closeCode.name} ~ ${event.closeCode.code}; recoverable=${if (event.recoverable) "yes" else "no"})")
            }

            if (this@on is DisconnectEvent.RetryLimitReachedEvent)
                append("Failed to established connection too many times.")

            if (this@on is DisconnectEvent.ReconnectingEvent)
                append("Requested reconnect from Discord.")

            if (this@on is DisconnectEvent.SessionReset)
                append("Gateway was closed; attempting to start new session.")

            if (this@on is DisconnectEvent.ZombieConnectionEvent)
                append("Discord is no longer responding to gateway commands.")
        }

        logger.warn("Shard #${this.shard} has disconnected from the world: $reason")
    }
}
