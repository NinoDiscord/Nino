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

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import com.zaxxer.hikari.util.IsolationLevel
import dev.floofy.haru.Scheduler
import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.features.*
import io.ktor.client.features.json.*
import io.ktor.client.features.json.serializer.*
import io.ktor.client.features.websocket.*
import kotlinx.serialization.json.Json
import org.koin.dsl.module
import org.redisson.Redisson
import org.slf4j.LoggerFactory
import sh.nino.discord.data.Config

val globalModule = module {
    single {
        val logger = LoggerFactory.getLogger(Scheduler::class.java)
        Scheduler {
            handleError { job, t -> logger.error("Exception has occured while running ${job.name}:", t) }
        }
    }

    single {
        Json {
            ignoreUnknownKeys = true
        }
    }

    single {
        HttpClient(OkHttp) {
            engine {
                config {
                    followRedirects(true)
                }
            }

            install(WebSockets)

            install(JsonFeature) {
                serializer = KotlinxSerializer(get())
            }

            install(UserAgent) {
                agent = "Nino/DiscordBot (+https://github.com/NinoDiscord/Nino; v${NinoInfo.VERSION})"
            }
        }
    }

    single {
        val config: Config = get()
        HikariDataSource(
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
    }

    single {
        val config = get<Config>()
        val cfg = org.redisson.config.Config()
        val protogay = if (config.redis.ssl) "rediss://" else "redis://"

        if (config.redis.sentinels.isNotEmpty()) {
            logger.info("Using Redis Sentinel configuration")

            if (config.redis.master == null)
                throw IllegalArgumentException("`config.redis.master` cannot be null if using Redis Sentinel configuration.")

            cfg.useSentinelServers().apply {
                masterName = config.redis.master
                database = config.redis.index

                if (config.redis.password != null) {
                    password = config.redis.password
                }

                addSentinelAddress(*config.redis.sentinels.map { "$protogay${it.host}:${it.port}" }.toTypedArray())
            }
        } else {
            logger.info("Using Redis Standalone configuration")
            cfg.useSingleServer().apply {
                address = "$protogay${config.redis.host}:${config.redis.port}"
                database = config.redis.index

                if (config.redis.password != null) {
                    password = config.redis.password
                }
            }
        }

        Redisson.create(cfg)
    }
}
