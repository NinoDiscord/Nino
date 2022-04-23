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

package sh.nino.core.interceptors

import gay.floof.utils.slf4j.logging
import okhttp3.Interceptor
import okhttp3.Response
import org.apache.commons.lang3.time.StopWatch
import java.util.concurrent.TimeUnit

class LogInterceptor: Interceptor {
    private val log by logging<LogInterceptor>()

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val watch = StopWatch.createStarted()

        log.info("-> ${request.method.uppercase()} ${request.url}")
        val res = chain.proceed(request)
        watch.stop()

        log.info("<- [${res.code} ${res.message.ifEmpty { "OK" }} / ${res.protocol.toString().replace("h2", "http/2")}] ${request.method.uppercase()} ${request.url} [${watch.getTime(TimeUnit.MILLISECONDS)}ms]")
        return res
    }
}
