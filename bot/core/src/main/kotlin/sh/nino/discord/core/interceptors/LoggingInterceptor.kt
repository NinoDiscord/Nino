package sh.nino.discord.core.interceptors

import gay.floof.utils.slf4j.logging
import okhttp3.Interceptor
import okhttp3.Response
import org.apache.commons.lang3.time.StopWatch
import java.util.concurrent.TimeUnit

class LoggingInterceptor: Interceptor {
    private val log by logging<LoggingInterceptor>()

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
