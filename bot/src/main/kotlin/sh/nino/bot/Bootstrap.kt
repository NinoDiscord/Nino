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

package sh.nino.bot

import com.charleskorn.kaml.Yaml
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import com.zaxxer.hikari.util.IsolationLevel
import dev.kord.cache.map.MapLikeCollection
import dev.kord.cache.map.internal.MapEntryCache
import dev.kord.core.Kord
import gay.floof.utils.slf4j.logging
import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.features.*
import io.ktor.client.features.json.*
import io.ktor.client.features.json.serializer.*
import io.ktor.client.features.websocket.*
import io.sentry.Sentry
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.DatabaseConfig
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.Slf4jSqlDebugLogger
import org.jetbrains.exposed.sql.transactions.transaction
import org.koin.core.context.GlobalContext
import org.koin.core.context.startKoin
import org.koin.dsl.module
import sh.nino.commons.NinoInfo
import sh.nino.commons.data.Config
import sh.nino.commons.data.Environment
import sh.nino.commons.extensions.retrieve
import sh.nino.core.NinoBot
import sh.nino.core.NinoScope
import sh.nino.core.globalModule
import sh.nino.core.interceptors.LogInterceptor
import sh.nino.core.interceptors.SentryInterceptor
import sh.nino.core.jobs.jobsModule
import sh.nino.core.redis.Manager
import sh.nino.core.sentry.SentryLogger
import sh.nino.database.registerOrUpdateEnums
import sh.nino.database.tables.*
import sh.nino.modules.Registry
import sh.nino.modules.localisation.LocalisationModule
import sh.nino.modules.metrics.MetricsModule
import sh.nino.modules.punishments.PunishmentModule
import sh.nino.modules.timeouts.TimeoutsModule
import java.io.File
import java.io.IOError
import java.lang.management.ManagementFactory
import kotlin.concurrent.thread
import kotlin.system.exitProcess

object Bootstrap {
    private val log by logging<Bootstrap>()

    @JvmStatic
    fun main(args: Array<String>) {
        Thread.currentThread().name = "Nino-BootstrapThread"

        val bannerFile = File("./assets/banner.txt").readText(Charsets.UTF_8)
        for (line in bannerFile.split("\n")) {
            val l = line
                .replace("{{.Version}}", NinoInfo.VERSION)
                .replace("{{.CommitSha}}", NinoInfo.COMMIT_HASH)
                .replace("{{.BuildDate}}", NinoInfo.BUILD_DATE)

            println(l)
        }

        val configFile = File("./config.yml")
        val config = Yaml.default.decodeFromString(Config.serializer(), configFile.readText())

        log.info("Connecting to PostgreSQL...")
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
                // defaultIsolationLevel = IsolationLevel.TRANSACTION_REPEATABLE_READ.levelId
                sqlLogger = if (config.environment == Environment.Development) {
                    Slf4jSqlDebugLogger
                } else {
                    null
                }
            }
        )

        // Create the database enums
        runBlocking {
            registerOrUpdateEnums()
        }

        // Create the missing tables and columns
        transaction {
            SchemaUtils.createMissingTablesAndColumns(
                AutomodTable,
                CasesTable,
                GlobalBansTable,
                GuildsTable,
                LoggingTable,
                PunishmentsTable,
                TagsTable,
                UsersTable,
                WarningsTable
            )
        }

        log.info("Connected to PostgreSQL successfully! Now connecting to Redis...")
        val redis = Manager(config)
        redis.connect()

        log.info("Connected to Redis! Creating Kord instance...")
        val kord = runBlocking {
            Kord(config.token) {
                enableShutdownHook = false
                cache {
                    members { cache, desc -> MapEntryCache(cache, desc, MapLikeCollection.concurrentHashMap()) }
                    users { cache, desc -> MapEntryCache(cache, desc, MapLikeCollection.concurrentHashMap()) }
                }
            }
        }

        // Setup Sentry
        val os = ManagementFactory.getOperatingSystemMXBean()
        if (config.sentryDsn != null) {
            log.info("Installing Sentry...")

            Sentry.init {
                it.dsn = config.sentryDsn
                it.release = "v${NinoInfo.VERSION} (${NinoInfo.COMMIT_HASH})"
                it.setLogger(SentryLogger(config.environment == Environment.Development))
            }

            Sentry.configureScope {
                it.tags += mutableMapOf(
                    "nino.environment" to config.environment.toString(),
                    "nino.build.date" to NinoInfo.BUILD_DATE,
                    "nino.commitSha" to NinoInfo.COMMIT_HASH,
                    "nino.version" to NinoInfo.VERSION,
                    "system.user" to System.getProperty("user.name"),
                    "system.os" to "${os.name} (${os.arch}; ${os.version})"
                )
            }
        }

        val json = Json {
            ignoreUnknownKeys = true
            isLenient = true
        }

        val httpClient = HttpClient(OkHttp) {
            engine {
                config {
                    followRedirects(true)
                    addInterceptor(LogInterceptor())

                    if (Sentry.isEnabled()) {
                        addInterceptor(SentryInterceptor())
                    }
                }
            }

            install(WebSockets)
            install(JsonFeature) {
                serializer = KotlinxSerializer(json)
            }

            install(UserAgent) {
                agent = "Nino/DiscordBot (+https://github.com/NinoDiscord/Nino; v${NinoInfo.VERSION})"
            }
        }

        log.info("Created Kord instance! Initializing modules...")
        val registry = Registry()
        registry.register(MetricsModule(config.metrics, config.api != null))
        registry.register(LocalisationModule(config.defaultLocale, json))
        registry.register(TimeoutsModule(config.timeouts.uri, config.timeouts.auth, httpClient, json))
        registry.register(PunishmentModule())

        log.info("Initialized modules! Initializing Koin...")
        val koin = startKoin {
            modules(
                jobsModule,
                globalModule,
                module {
                    single { config }
                    single { kord }
                    single { dataSource }
                    single { redis }
                    single { registry }
                    single { json }
                    single { httpClient }
                    single { NinoBot() }
                }
            )
        }

        log.info("Initialized modules! Launching Nino...")
        addShutdownHook()
        installGlobalUnhandledExceptionHandler()

        runBlocking {
            val bot = koin.koin.get<NinoBot>()
            try {
                bot.start()
            } catch (e: Exception) {
                log.error("Unable to bootstrap Nino:", e)
                exitProcess(1)
            }
        }
    }

    private fun addShutdownHook() {
        val runtime = Runtime.getRuntime()
        runtime.addShutdownHook(
            thread(start = false, name = "Nino-ShutdownThread") {
                log.warn("Shutting down...")

                if (GlobalContext.getKoinApplicationOrNull() != null) {
                    val kord = GlobalContext.retrieve<Kord>()
                    val ds = GlobalContext.retrieve<HikariDataSource>()
                    val redis = GlobalContext.retrieve<Manager>()
                    val registry = GlobalContext.retrieve<Registry>()

                    runBlocking {
                        kord.gateway.stopAll()
                        NinoScope.cancel()
                    }

                    ds.close()
                    redis.close()
                    registry.unregisterAll()
                }

                log.info("We are going offline, bye!")
            }
        )
    }

    // credit: https://github.com/elastic/logstash/blob/main/logstash-core/src/main/java/org/logstash/Logstash.java#L98-L133
    private fun installGlobalUnhandledExceptionHandler() {
        Thread.setDefaultUncaughtExceptionHandler { t, e ->
            if (e is Error) {
                log.error("Uncaught error in thread ${t.name} (#${t.id})", e)
                var success = false

                if (e is InternalError) {
                    success = true
                    Runtime.getRuntime().halt(128)
                }

                if (e is OutOfMemoryError) {
                    success = true
                    Runtime.getRuntime().halt(127)
                }

                if (e is StackOverflowError) {
                    success = true
                    Runtime.getRuntime().halt(126)
                }

                if (e is UnknownError) {
                    success = true
                    Runtime.getRuntime().halt(125)
                }

                if (e is IOError) {
                    success = true
                    Runtime.getRuntime().halt(124)
                }

                if (e is LinkageError) {
                    success = true
                    Runtime.getRuntime().halt(123)
                }

                if (!success) {
                    Runtime.getRuntime().halt(120)
                }

                exitProcess(1)
            } else {
                log.error("Uncaught exception in thread ${t.name} (#${t.id})", e)
            }
        }
    }
}
