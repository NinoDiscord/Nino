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

import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.features.*
import io.ktor.client.features.json.*
import io.ktor.client.features.json.serializer.*
import io.ktor.client.features.websocket.*
import io.sentry.Sentry
import kotlinx.serialization.json.Json
import org.koin.dsl.module
import sh.nino.discord.common.NinoInfo
import sh.nino.discord.common.data.Config
import sh.nino.discord.core.interceptors.LoggingInterceptor
import sh.nino.discord.core.interceptors.SentryInterceptor
import sh.nino.discord.core.localization.LocalizationManager
import sh.nino.discord.core.timers.TimerManager
import sh.nino.discord.metrics.MetricsRegistry
import sh.nino.discord.timeouts.Client

val globalModule = module {
    single {
        NinoBot()
    }

    single {
        Json {
            ignoreUnknownKeys = true
            isLenient = true
        }
    }

    single {
        HttpClient(OkHttp) {
            engine {
                config {
                    followRedirects(true)
                    addInterceptor(LoggingInterceptor())

                    if (Sentry.isEnabled()) {
                        addInterceptor(SentryInterceptor())
                    }
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
        LocalizationManager(get())
    }

    single {
        val config: Config = get()
        Client {
            coroutineScope = NinoScope
            httpClient = get()
            json = get()
            uri = config.timeouts.uri

            if (config.timeouts.auth != null) {
                auth = config.timeouts.auth as String
            }
        }
    }

    single {
        TimerManager()
    }

    single {
        MetricsRegistry(get())
    }
}
