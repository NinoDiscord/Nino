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

package sh.nino.core

import dev.kord.common.annotation.KordExperimental
import dev.kord.common.annotation.KordUnsafe
import dev.kord.common.entity.ActivityType
import dev.kord.common.entity.DiscordBotActivity
import dev.kord.common.entity.PresenceStatus
import dev.kord.core.Kord
import dev.kord.gateway.DiscordPresence
import dev.kord.gateway.Intent
import dev.kord.gateway.Intents
import dev.kord.gateway.PrivilegedIntent
import dev.kord.rest.route.Route
import gay.floof.utils.slf4j.logging
import org.koin.core.context.GlobalContext
import sh.nino.commons.Constants
import sh.nino.commons.NinoInfo
import sh.nino.commons.extensions.formatSize
import sh.nino.commons.extensions.retrieve
import sh.nino.commons.extensions.retrieveAll
import sh.nino.core.listeners.applyGenericEvents
import sh.nino.core.timers.Job
import sh.nino.core.timers.Manager
import java.lang.management.ManagementFactory
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class NinoBot {
    companion object {
        val executorPool: ExecutorService = Executors.newCachedThreadPool(NinoThreadFactory)
    }

    private val log by logging<NinoBot>()
    val bootTime = System.currentTimeMillis()

    @OptIn(KordUnsafe::class, KordExperimental::class, PrivilegedIntent::class)
    suspend fun start() {
        val runtime = Runtime.getRuntime()
        val os = ManagementFactory.getOperatingSystemMXBean()
        val threads = ManagementFactory.getThreadMXBean()

        log.info("+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+")
        log.info("Runtime Information:")
        log.info("  * Free / Total Memory [Max]: ${runtime.freeMemory().formatSize()}/${runtime.totalMemory().formatSize()} [${runtime.maxMemory().formatSize()}]")
        log.info("  * Threads: ${threads.threadCount} (${threads.daemonThreadCount} background threads)")
        log.info("  * Operating System: ${os.name} with ${os.availableProcessors} processors (${os.arch}; ${os.version})")
        log.info("  * Versions:")
        log.info("      * JVM [JRE]: v${System.getProperty("java.version", "Unknown")} (${System.getProperty("java.vendor", "Unknown")}) [${Runtime.version()}]")
        log.info("      * Kotlin:    v${KotlinVersion.CURRENT}")
        log.info("      * Nino:      v${NinoInfo.VERSION} (${NinoInfo.COMMIT_HASH} -- ${NinoInfo.BUILD_DATE})")

        if (Constants.dediNode != null)
            log.info("  * Dedicated Node: ${Constants.dediNode}")

        log.info("+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+")

        val kord = GlobalContext.retrieve<Kord>()
        val gatewayInfo = kord.rest.unsafe(Route.GatewayBotGet) {}

        log.info("+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+")
        log.info("Sharding Information:")
        log.info("  * Using shard orchestrator: <unknown>")
        log.info("  * Shards to Launch:         ${gatewayInfo.shards}")
        log.info("  * Session Limit:            ${gatewayInfo.sessionStartLimit.remaining} / ${gatewayInfo.sessionStartLimit.total}")
        log.info("+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+")

        // Schedule all timers
        val scheduler = GlobalContext.retrieve<Manager>()
        val jobs = GlobalContext.retrieveAll<Job>()
        scheduler.bulkSchedule(*jobs.toTypedArray())

        // Apply Kord events we need
        kord.applyGenericEvents()
//        kord.applyGuildEvents()
//        kord.applyGuildMemberEvents()
//        kord.applyUserEvents()
//        kord.applyVoiceStateEvents()
//        kord.applyGuildBanEvents()

        // Launch!
        kord.login {
            presence = DiscordPresence(
                status = PresenceStatus.Idle,
                game = DiscordBotActivity(
                    name = "server fans go whirr...",
                    type = ActivityType.Listening
                ),

                afk = true,
                since = System.currentTimeMillis()
            )

            intents = Intents {
                +Intent.Guilds
                +Intent.GuildMessages
                +Intent.GuildBans
                +Intent.GuildVoiceStates
                +Intent.GuildMembers
            }
        }
    }
}
