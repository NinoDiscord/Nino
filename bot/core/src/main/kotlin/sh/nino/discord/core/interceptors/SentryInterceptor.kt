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

package sh.nino.discord.core.interceptors

import io.sentry.*
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class SentryInterceptor: Interceptor {
    private val hub: IHub = HubAdapter.getInstance()

    override fun intercept(chain: Interceptor.Chain): Response {
        var request = chain.request()
        val url = "${request.method} ${request.url.encodedPath}"
        val span = hub.span?.startChild("nino.http.client", "Request $url")
        var statusCode = 200
        var response: Response? = null

        return try {
            span?.toSentryTrace()?.let {
                request = request
                    .newBuilder()
                    .addHeader(it.name, it.value)
                    .build()
            }

            response = chain.proceed(request)
            statusCode = response.code
            span?.status = SpanStatus.fromHttpStatusCode(statusCode)

            response
        } catch (e: IOException) {
            span?.apply {
                this.throwable = e
                this.status = SpanStatus.INTERNAL_ERROR
            }

            throw e
        } finally {
            span?.finish()

            val breb = Breadcrumb.http(request.url.toString(), request.method, statusCode)
            breb.level = if (response?.isSuccessful == true) SentryLevel.FATAL else SentryLevel.ERROR
            hub.addBreadcrumb(breb)
        }
    }
}
