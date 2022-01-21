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

package sh.nino.discord

import com.charleskorn.kaml.Yaml
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import com.zaxxer.hikari.util.IsolationLevel
import dev.kord.cache.map.MapLikeCollection
import dev.kord.cache.map.internal.MapEntryCache
import dev.kord.core.Kord
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.core.on
import gay.floof.utils.slf4j.logging
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.koin.core.context.GlobalContext
import org.koin.core.context.startKoin
import org.koin.dsl.module
import sh.nino.discord.api.ApiServer
import sh.nino.discord.api.apiModule
import sh.nino.discord.commands.CommandHandler
import sh.nino.discord.commands.commandsModule
import sh.nino.discord.common.NinoInfo
import sh.nino.discord.common.data.Config
import sh.nino.discord.common.data.Environment
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.core.NinoBot
import sh.nino.discord.core.NinoScope
import sh.nino.discord.core.globalModule
import sh.nino.discord.core.redis.RedisManager
import sh.nino.discord.database.createPgEnums
import sh.nino.discord.database.tables.*
import sh.nino.discord.punishments.punishmentsModule
import sh.nino.discord.timeouts.Client
import java.io.File
import kotlin.concurrent.thread
import kotlin.system.exitProcess

object Bootstrap {
    private val logger by logging<Bootstrap>()

    init {
        addShutdownHook()
    }

    @JvmStatic
    fun main(args: Array<String>) {
        Thread.currentThread().name = "Nino-MainThread"

        val bannerFile = File("./assets/banner.txt").readText(Charsets.UTF_8)
        for (line in bannerFile.split("\n")) {
            val l = line
                .replace("{{.Version}}", NinoInfo.VERSION)
                .replace("{{.CommitSha}}", NinoInfo.COMMIT_SHA)
                .replace("{{.BuildDate}}", NinoInfo.BUILD_DATE)

            println(l)
        }

        val configFile = File("./config.yml")
        val config = Yaml.default.decodeFromString(Config.serializer(), configFile.readText())

        logger.info("* Connecting to PostgreSQL...")
        val dataSource = HikariDataSource(
            HikariConfig().apply {
                jdbcUrl = "jdbc:postgresql://${config.database.host}:${config.database.port}/${config.database.name}"
                username = config.database.username
                password = config.database.password
                schema = config.database.schema
                driverClassName = "org.postgresql.Driver"
                isAutoCommit = false
                transactionIsolation = IsolationLevel.TRANSACTION_REPEATABLE_READ.name
                leakDetectionThreshold = 30L * 1000
                poolName = "Nino-HikariPool"
            }
        )

        Database.connect(
            dataSource,
            databaseConfig = DatabaseConfig {
                defaultRepetitionAttempts = 5
                defaultIsolationLevel = IsolationLevel.TRANSACTION_REPEATABLE_READ.levelId
                sqlLogger = if (config.environment == Environment.Development) {
                    Slf4jSqlDebugLogger
                } else {
                    null
                }
            }
        )

        runBlocking {
            createPgEnums(
                mapOf(
                    "BanTypeEnum" to BanType.values().map { it.name },
                    "PunishmentTypeEnum" to PunishmentType.values().map { it.name }
                )
            )
        }

        transaction {
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

        logger.info("* Connecting to Redis...")
        val redis = RedisManager(config)
        redis.connect()

        val kord = runBlocking {
            Kord(config.token) {
                enableShutdownHook = false

                cache {
                    // cache members
                    members { cache, description ->
                        MapEntryCache(cache, description, MapLikeCollection.concurrentHashMap())
                    }

                    // cache users
                    users { cache, description ->
                        MapEntryCache(cache, description, MapLikeCollection.concurrentHashMap())
                    }
                }
            }
        }

        logger.info("* Initializing Koin...")
        val koin = startKoin {
            modules(
                globalModule,
                *apiModule.toTypedArray(),
                *commandsModule.toTypedArray(),
                module {
                    single {
                        config
                    }

                    single {
                        kord
                    }

                    single {
                        dataSource
                    }

                    single {
                        redis
                    }
                },

                punishmentsModule
            )
        }

        // implement kord events here
        kord.on<MessageCreateEvent> {
            val handler = koin.koin.get<CommandHandler>()
            handler.onCommand(this)
        }

        // run api here
        if (config.api != null) {
            NinoScope.launch {
                GlobalContext.retrieve<ApiServer>().launch()
            }
        }

        val bot = koin.koin.get<NinoBot>()
        runBlocking {
            try {
                bot.start()
            } catch (e: Exception) {
                logger.error("Unable to initialize Nino:", e)
                exitProcess(1)
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
                val redis = GlobalContext.retrieve<RedisManager>()

                // Close off the Nino scope and detach all shards
                runBlocking {
                    kord.gateway.detachAll()
                    apiServer.shutdown()
                    NinoScope.cancel()
                }

                // Close off the database connection
                dataSource.close()
                timeouts.close()
                redis.close()

                logger.info("Successfully shut down! Goodbye.")
            }
        )
    }
}
