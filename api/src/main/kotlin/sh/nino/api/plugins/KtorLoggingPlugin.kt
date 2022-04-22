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

package sh.nino.api.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.application.hooks.*
import io.ktor.server.request.*
import io.ktor.util.*
import org.apache.commons.lang3.time.StopWatch
import org.slf4j.LoggerFactory
import java.util.concurrent.TimeUnit

val KtorLoggingPlugin = createApplicationPlugin("KtorLoggingPlugin") {
    val stopwatchKey = AttributeKey<StopWatch>("stopwatchKey")
    val log = LoggerFactory.getLogger("sh.nino.api.plugins.KtorLoggingPluginKt")

    environment?.monitor?.subscribe(ApplicationStarted) {
        log.info("HTTP service has started successfully! :3")
    }

    environment?.monitor?.subscribe(ApplicationStopped) {
        log.warn("HTTP service has completely stopped. :(")
    }

    onCall { call ->
        call.attributes.put(stopwatchKey, StopWatch.createStarted())
    }

    on(ResponseSent) { call ->
        val method = call.request.httpMethod
        val version = call.request.httpVersion
        val endpoint = call.request.uri
        val status = call.response.status() ?: HttpStatusCode(-1, "Unknown HTTP Method")
        val stopwatch = call.attributes[stopwatchKey]
        val userAgent = call.request.userAgent()

        stopwatch.stop()
        log.info("${method.value} $version $endpoint :: ${status.value} ${status.description} [UA=$userAgent] [${stopwatch.getTime(TimeUnit.MILLISECONDS)}ms]")
    }
}
