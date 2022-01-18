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
