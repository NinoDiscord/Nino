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

package sh.nino.discord

import com.zaxxer.hikari.HikariDataSource
import dev.kord.common.annotation.*
import dev.kord.common.entity.ActivityType
import dev.kord.common.entity.DiscordBotActivity
import dev.kord.common.entity.PresenceStatus
import dev.kord.core.Kord
import dev.kord.gateway.DiscordPresence
import dev.kord.gateway.Intent
import dev.kord.gateway.Intents
import dev.kord.gateway.PrivilegedIntent
import dev.kord.rest.route.Route
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.StdOutSqlLogger
import org.jetbrains.exposed.sql.addLogger
import org.koin.core.context.GlobalContext
import sh.nino.discord.core.NinoScope
import sh.nino.discord.core.database.tables.*
import sh.nino.discord.core.database.transactions.asyncTransaction
import sh.nino.discord.core.threading.NinoThreadFactory
import sh.nino.discord.data.Config
import sh.nino.discord.data.Environment
import sh.nino.discord.extensions.inject
import sh.nino.discord.kotlin.logging
import sh.nino.discord.subscribers.applyGenericEvents
import sh.nino.discord.subscribers.applyMessageEvents
import java.lang.management.ManagementFactory
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.concurrent.thread

class NinoBot {
    companion object {
        val executorPool: ExecutorService = Executors.newCachedThreadPool(NinoThreadFactory())
    }

    private val logger by logging<NinoBot>()
    val startTime = System.currentTimeMillis()

    @OptIn(PrivilegedIntent::class, KordUnsafe::class, KordExperimental::class)
    suspend fun launch() {
        val koin = GlobalContext.get()
        val runtime = Runtime.getRuntime()
        val dediNode = try {
            System.getenv()["DEDI_NODE"]
        } catch (e: Exception) {
            null
        }

        val os = ManagementFactory.getOperatingSystemMXBean()
        logger.info("================================")
        logger.info("Displaying runtime info:")
        logger.info("* Free / Total Memory - ${runtime.freeMemory() / 1024L / 1024L}/${runtime.totalMemory() / 1024L / 1024L}MB")
        logger.info("* Max Memory - ${runtime.maxMemory() / 1024L / 1024L}MB")
        logger.info("* JVM: v${System.getProperty("java.version")} (${System.getProperty("java.vendor", "<NA>")})")
        logger.info("* Kotlin: v${KotlinVersion.CURRENT}")
        logger.info("* Operating System: ${os.name} (${os.arch}; ${os.version})")

        if (dediNode != null) logger.info("* Dedi Node: $dediNode")

        val kord = GlobalContext.inject<Kord>()
        val gateway = kord.rest.unsafe(Route.GatewayBotGet) {}

        logger.info("================================")
        logger.info("Displaying gateway info:")
        logger.info("* Shards to launch: ${gateway.shards}")
        logger.info(
            "* Session Limit: ${gateway.sessionStartLimit.remaining}/${gateway.sessionStartLimit.total}"
        )

        logger.info("* Connecting to PostgreSQL...")

        val dataSource = koin.get<HikariDataSource>()
        val config = koin.get<Config>()

        Database.connect(dataSource)
        if (config.environment == Environment.Development) {
            logger.debug("Enabling Exposed SQL logger...")
            asyncTransaction {
                addLogger(StdOutSqlLogger)
            }.execute()
        }

        asyncTransaction {
            // drop if it exists
            execInBatch(
                listOf(
                    "DROP TYPE IF EXISTS PunishmentTypeEnum",
                    "DROP TYPE IF EXISTS GlobalBanTypeEnum",
                    "DROP TYPE IF EXISTS LogEventEnum"
                )
            )

            // create new types
            val banKeyNames = BanType.values().joinToString(", ") { "'${it.key}'" }
            val punishmentKeyNames = PunishmentType.values().joinToString(", ") { "'${it.key}'" }
            val logEventKeyNames = LogEvent.values().joinToString(", ") { "'${it.key}'" }

            execInBatch(
                listOf(
                    "CREATE TYPE GlobalBanTypeEnum AS ENUM ($banKeyNames)",
                    "CREATE TYPE PunishmentTypeEnum AS ENUM ($punishmentKeyNames)",
                    "CREATE TYPE LogEventEnum AS ENUM ($logEventKeyNames)"
                )
            )

            SchemaUtils.createMissingTablesAndColumns(
                AutomodTable,
                GlobalBansTable,
                GuildCases,
                Guilds,
                Logging,
                Users
            )
        }.execute()

        kord.applyGenericEvents()
        kord.applyMessageEvents()
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

    fun addShutdownHook() {
        val kord = GlobalContext.inject<Kord>()
        val shutdownThread = thread(name = "Nino-ShutdownThread", start = false) {
            logger.warn("Shutting down Nino...")
            runBlocking {
                kord.gateway.detachAll()
                NinoScope.cancel()
            }

            logger.warn("Nino has shut down, goodbye senpai.")
        }

        logger.info("Enabled shutdown hook thread.")
        Runtime.getRuntime().addShutdownHook(shutdownThread)
    }
}
