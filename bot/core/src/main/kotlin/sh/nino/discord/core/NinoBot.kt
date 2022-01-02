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
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.koin.core.context.GlobalContext
import sh.nino.discord.api.ApiServer
import sh.nino.discord.common.NinoInfo
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.data.Environment
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.core.listeners.applyGenericEvents
import sh.nino.discord.core.localization.LocalizationManager
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.createPgEnums
import sh.nino.discord.database.tables.*
import sh.nino.discord.timeouts.Client
import java.lang.management.ManagementFactory
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import kotlin.concurrent.thread

class NinoBot {
    private val logger by logging<NinoBot>()
    val bootTime = System.currentTimeMillis()

    init {
        addShutdownHook()
    }

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
        logger.info("* JVM: ${System.getProperty("java.version")} (${System.getProperty("java.vendor", "<NA>")})")
        logger.info("* Kotlin: ${KotlinVersion.CURRENT}")
        logger.info("* Operating System: ${os.name} with ${os.availableProcessors} processors (${os.arch}; ${os.version})")

        if (dediNode != null)
            logger.info("* Dedi Node: $dediNode")

        val kord = GlobalContext.retrieve<Kord>()
        val config = GlobalContext.retrieve<Config>()
        val gatewayInfo = kord.rest.unsafe(Route.GatewayBotGet) {}

        logger.info("Displaying gateway information:")
        logger.info("* Shards to launch: ${gatewayInfo.shards}")
        logger.info("* Session Limit:    ${gatewayInfo.sessionStartLimit.remaining}/${gatewayInfo.sessionStartLimit.total}")

        logger.info("* Connecting to PostgreSQL...")

        val dataSource = GlobalContext.retrieve<HikariDataSource>()
        Database.connect(
            dataSource,
            databaseConfig = DatabaseConfig {
                defaultRepetitionAttempts = 5
                defaultIsolationLevel = IsolationLevel.TRANSACTION_REPEATABLE_READ.levelId
            }
        )

        if (config.environment == Environment.Development) {
            logger.debug("* Enabling SQL logger since we're in development.")
            transaction {
                addLogger(StdOutSqlLogger)
            }
        }

        createPgEnums(
            mapOf(
                "BanTypeEnum" to BanType.values().map { it.key },
                "PunishmentTypeEnum" to PunishmentType.values().map { it.key },
                "LogEventEnum" to LogEvent.values().map { it.key }
            )
        )

        asyncTransaction {
            SchemaUtils.createMissingTablesAndColumns(
                AutomodTable,
                GlobalBansTable,
                GuildCases,
                GuildSettings,
                GuildLogging,
                Users,
                Warnings
            )
        }

        // Initialize localization
        GlobalContext.retrieve<LocalizationManager>()

        // Setup Sentry
        if (config.sentryDsn != null) {
            logger.info("* Installing Sentry...")
            Sentry.init {
                it.dsn = config.sentryDsn
                it.release = "Nino v${NinoInfo.VERSION}"
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

        // Setup text-based commands
        // GlobalContext.retrieve<CommandHandler>()

        // Setup slash commands
        // GlobalContext.retrieve<SlashCommandHandler>()

        // Startup the timeouts client in a different coroutine scope
        // since it will block this thread (and we don't want that.)
        NinoScope.launch {
            val timeouts = GlobalContext.retrieve<Client>()
            timeouts.connect()
        }

        // Same with the API server, let's not block this thread
        if (config.api != null) {
            NinoScope.launch {
                GlobalContext.retrieve<ApiServer>().launch()
            }
        }

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

    private fun addShutdownHook() {
        logger.info("Adding shutdown hook...")

        val runtime = Runtime.getRuntime()
        runtime.addShutdownHook(
            thread(false, name = "Nino-ShutdownThread") {
                logger.warn("Shutting down...")

                val kord = GlobalContext.retrieve<Kord>()
                val dataSource = GlobalContext.retrieve<HikariDataSource>()
                val apiServer = GlobalContext.retrieve<ApiServer>()
                val timeouts = GlobalContext.retrieve<Client>()

                // Close off the Nino scope and detach all shards
                runBlocking {
                    kord.gateway.detachAll()
                    NinoScope.cancel()
                }

                // Close off the database connection
                dataSource.close()
                apiServer.shutdown()
                timeouts.close()

                logger.info("Successfully shut down! Goodbye.")
            }
        )
    }

    companion object {
        val executorPool: Executor = Executors.newCachedThreadPool(NinoThreadFactory)
        val dediNode by lazy {
            // Check in properties (most likely in production)
            val dediNode1 = System.getProperty("winterfox.dedi", "?")
            if (dediNode1 != "?") {
                return@lazy dediNode1
            }

            // Check in environment variables
            val dediNode2 = System.getenv("WINTERFOX_DEDI_NODE") ?: ""
            if (dediNode2 != "") {
                return@lazy dediNode2
            }

            null
        }
    }
}
