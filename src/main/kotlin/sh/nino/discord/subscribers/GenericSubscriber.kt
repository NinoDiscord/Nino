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

package sh.nino.discord.subscribers

import dev.kord.common.entity.PresenceStatus
import dev.kord.core.Kord
import dev.kord.core.event.gateway.DisconnectEvent
import dev.kord.core.event.gateway.ReadyEvent
import dev.kord.core.on
import kotlinx.coroutines.flow.count
import kotlinx.coroutines.launch
import org.koin.core.context.GlobalContext
import org.slf4j.LoggerFactory
import sh.nino.discord.NinoBot
import sh.nino.discord.core.NinoScope
import sh.nino.discord.core.ktor.NinoKtorServer
import sh.nino.discord.data.Config

fun Kord.applyGenericEvents() {
    val logger = LoggerFactory.getLogger("sh.nino.discord.subscribers.GenericSubscriber")
    val koin = GlobalContext.get()

    on<ReadyEvent> {
        val nino = koin.get<NinoBot>()

        logger.info("Logged in as ${this.self.tag} (${this.self.id.asString})")
        logger.info("Launched in ~${System.currentTimeMillis() - nino.startTime}ms | Guilds: ${kord.guilds.count()}")

        val config = koin.get<Config>()
        val prefix = config.prefixes.first()
        val ktor = koin.get<NinoKtorServer>()

        NinoScope.launch {
            ktor.launch()
        }

        kord.editPresence {
            status = PresenceStatus.Online
            playing("with ${kord.guilds.count()} guilds | ${prefix}help | https://nino.sh")
        }
    }

    on<DisconnectEvent> {
        val reason = buildString {
            append("Reason: ")

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
                append("Failed to established connection too many times, please restart the bot.")

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
