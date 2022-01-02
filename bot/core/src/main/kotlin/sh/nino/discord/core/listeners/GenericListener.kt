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

package sh.nino.discord.core.listeners

import dev.kord.common.entity.ActivityType
import dev.kord.core.Kord
import dev.kord.core.event.gateway.DisconnectEvent
import dev.kord.core.event.gateway.ReadyEvent
import dev.kord.core.on
import org.koin.core.context.GlobalContext
import org.slf4j.LoggerFactory
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.extensions.humanize
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.core.NinoBot

fun Kord.applyGenericEvents() {
    val logger = LoggerFactory.getLogger("sh.nino.discord.core.listeners.GenericListenerKt")
    val nino = GlobalContext.retrieve<NinoBot>()

    on<ReadyEvent> {
        logger.info("Successfully launched bot as ${this.self.tag} (${this.self.id}) on shard #${this.shard} in ${(System.currentTimeMillis() - nino.bootTime).humanize(true)}")
        logger.info("Ready in ${this.guilds.size} guilds! | Using Discord Gateway v${this.gatewayVersion}")

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
