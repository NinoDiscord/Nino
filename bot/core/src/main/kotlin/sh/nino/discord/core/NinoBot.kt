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

package sh.nino.discord.core

import com.zaxxer.hikari.HikariDataSource
import com.zaxxer.hikari.util.IsolationLevel
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
import io.sentry.Sentry
import kotlinx.coroutines.launch
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.koin.core.context.GlobalContext
import sh.nino.discord.common.DEDI_NODE
import sh.nino.discord.common.NinoInfo
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.data.Environment
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.common.extensions.retrieveAll
import sh.nino.discord.core.listeners.applyGenericEvents
import sh.nino.discord.core.localization.LocalizationManager
import sh.nino.discord.core.redis.RedisManager
import sh.nino.discord.core.timers.TimerJob
import sh.nino.discord.core.timers.TimerManager
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.createPgEnums
import sh.nino.discord.database.tables.*
import sh.nino.discord.timeouts.Client
import java.lang.management.ManagementFactory
import java.util.concurrent.Executor
import java.util.concurrent.Executors

class NinoBot {
    private val logger by logging<NinoBot>()
    val bootTime = System.currentTimeMillis()

    @OptIn(KordUnsafe::class, KordExperimental::class, PrivilegedIntent::class)
    suspend fun start() {
        val runtime = Runtime.getRuntime()
        val os = ManagementFactory.getOperatingSystemMXBean()
        val threads = ManagementFactory.getThreadMXBean()

        val free = runtime.freeMemory() / 1024L / 1024L
        val total = runtime.totalMemory() / 1024L / 1024L
        val maxMem = runtime.maxMemory() / 1024L / 1024L

        logger.info("Displaying runtime information:")
        logger.info("* Free / Total (Max) Memory: ${free}MiB/${total}MiB (${maxMem}MiB)")
        logger.info("* Threads: ${threads.threadCount} (${threads.daemonThreadCount} daemon'd)")
        logger.info("* JVM: v${System.getProperty("java.version")} (${System.getProperty("java.vendor", "<NA>")})")
        logger.info("* Kotlin: v${KotlinVersion.CURRENT}")
        logger.info("* Operating System: ${os.name} with ${os.availableProcessors} processors (${os.arch}; ${os.version})")

        if (DEDI_NODE != "none")
            logger.info("* Dedi Node: $DEDI_NODE")

        val kord = GlobalContext.retrieve<Kord>()
        val config = GlobalContext.retrieve<Config>()
        val gatewayInfo = kord.rest.unsafe(Route.GatewayBotGet) {}

        logger.info("Displaying gateway information:")
        logger.info("* Shards to launch: ${gatewayInfo.shards}")
        logger.info("* Session Limit:    ${gatewayInfo.sessionStartLimit.remaining}/${gatewayInfo.sessionStartLimit.total}")

        // Initialize localization
        logger.info("* Initializing localization manager...")
        GlobalContext.retrieve<LocalizationManager>()

        // Setup Sentry
        if (config.sentryDsn != null) {
            logger.info("* Installing Sentry...")
            Sentry.init {
                it.dsn = config.sentryDsn
                it.release = "v${NinoInfo.VERSION} (${NinoInfo.COMMIT_SHA})"
            }

            Sentry.configureScope {
                it.tags += mutableMapOf(
                    "nino.environment" to config.environment.toString(),
                    "nino.build.date" to NinoInfo.BUILD_DATE,
                    "nino.commitSha" to NinoInfo.COMMIT_SHA,
                    "nino.version" to NinoInfo.VERSION,
                    "system.user" to System.getProperty("user.name"),
                    "system.os" to "${os.name} (${os.arch}; ${os.version})"
                )
            }
        }

        // Startup the timeouts client in a different coroutine scope
        // since it will block this thread (and we don't want that.)
        NinoScope.launch {
            val timeouts = GlobalContext.retrieve<Client>()
            timeouts.connect()
        }

        // Schedule all timer jobs
        val scheduler = GlobalContext.retrieve<TimerManager>()
        val jobs = GlobalContext.retrieveAll<TimerJob>()
        scheduler.bulkSchedule(*jobs.toTypedArray())

        // Startup Kord
        kord.applyGenericEvents()
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

    fun sentryReport(ex: Exception) {
        if (Sentry.isEnabled()) {
            Sentry.captureException(ex)
        }
    }

    companion object {
        val executorPool: Executor = Executors.newCachedThreadPool(NinoThreadFactory)
    }
}
