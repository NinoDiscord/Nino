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

package sh.nino.discord.api.middleware.ratelimiting

import gay.floof.utils.slf4j.logging
import io.ktor.application.*
import io.ktor.features.*
import io.ktor.http.*
import kotlinx.coroutines.future.await
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.apache.commons.lang3.time.StopWatch
import sh.nino.discord.common.extensions.inject
import sh.nino.discord.core.NinoScope
import sh.nino.discord.core.redis.RedisManager
import java.util.*
import java.util.concurrent.TimeUnit

@Serializable
data class Ratelimit(
    val remaining: Int = 1200,
    val resetTime: Instant = Clock.System.now(),
    val limit: Int = 1200
) {
    val exceeded: Boolean
        get() = !this.expired && this.remaining == 0

    val expired: Boolean
        get() = resetTime <= Clock.System.now()

    fun consume(): Ratelimit = copy(remaining = (remaining - 1).coerceAtLeast(0))
}

class Ratelimiter {
    private val logger by logging<Ratelimiter>()
    private val json by inject<Json>()
    private val redis by inject<RedisManager>()
    private val timer = Timer("Nino-APIRatelimitPurge")
    private val purgeMutex = Mutex()
    private val cachedRatelimits = mutableMapOf<String, Ratelimit>()

    init {
        val watch = StopWatch.createStarted()
        val count = redis.commands.hlen("nino:ratelimits").get()
        watch.stop()

        logger.info("Took ${watch.getTime(TimeUnit.MILLISECONDS)}ms to retrieve $count ratelimits!")
        val reorderWatch = StopWatch.createStarted()
        val result = redis.commands.hgetall("nino:ratelimits").get() as Map<String, String>

        // Decode from JSON
        // TODO: use protobufs > json
        // why? - https://i-am.floof.gay/images/8f3b01a0.png
        // NQN - not quite nitro discord bot
        for ((key, value) in result) {
            val ratelimit = json.decodeFromString(Ratelimit.serializer(), value)
            cachedRatelimits[key] = ratelimit
        }

        reorderWatch.stop()
        logger.info("Took ${watch.getTime(TimeUnit.MILLISECONDS)}ms to reorder in-memory rate limit cache.")

        // Clear the expired ones
        NinoScope.launch {
            val locked = purgeMutex.tryLock()
            if (locked) {
                try {
                    purge()
                } finally {
                    purgeMutex.unlock()
                }
            }
        }

        // Set up a timer every hour to purge!
        timer.scheduleAtFixedRate(
            object: TimerTask() {
                override fun run() {
                    NinoScope.launch {
                        val locked = purgeMutex.tryLock()
                        if (locked) {
                            try {
                                purge()
                            } finally {
                                purgeMutex.unlock()
                            }
                        }
                    }
                }
            },
            0, 3600000
        )
    }

    private suspend fun purge() {
        logger.info("Finding useless ratelimits...")

        val ratelimits = cachedRatelimits.filter { it.value.expired }
        logger.info("Found ${ratelimits.size} ratelimits to purge.")

        for (key in ratelimits.keys) {
            // Remove it from Redis and in-memory
            redis.commands.hdel("nino:ratelimits", key).await()
            cachedRatelimits.remove(key)
        }
    }

    // https://github.com/go-chi/httprate/blob/master/httprate.go#L25-L47
    fun getRealHost(call: ApplicationCall): String {
        val headers = call.request.headers

        val ip: String
        if (headers.contains("True-Client-IP")) {
            ip = headers["True-Client-IP"]!!
        } else if (headers.contains("X-Real-IP")) {
            ip = headers["X-Real-IP"]!!
        } else if (headers.contains(HttpHeaders.XForwardedFor)) {
            var index = headers[HttpHeaders.XForwardedFor]!!.indexOf(", ")
            if (index != -1) {
                index = headers[HttpHeaders.XForwardedFor]!!.length
            }

            ip = headers[HttpHeaders.XForwardedFor]!!.slice(0..index)
        } else {
            ip = call.request.origin.remoteHost
        }

        return ip
    }

    suspend fun get(call: ApplicationCall): Ratelimit {
        val ip = getRealHost(call)
        logger.debug("ip: $ip")

        val result: String? = redis.commands.hget("nino:ratelimits", ip).await()
        if (result == null) {
            val r = Ratelimit()

            cachedRatelimits[ip] = r
            redis.commands.hmset(
                "nino:ratelimits",
                mapOf(
                    ip to json.encodeToString(Ratelimit.serializer(), r)
                )
            )

            return r
        }

        val ratelimit = json.decodeFromString(Ratelimit.serializer(), result)
        val newRl = ratelimit.consume()

        redis.commands.hmset(
            "nino:ratelimits",
            mapOf(
                ip to json.encodeToString(Ratelimit.serializer(), newRl)
            )
        )

        cachedRatelimits[ip] = newRl
        return newRl
    }

    @Suppress("UNCHECKED_CAST")
    suspend fun close() {
        logger.warn("Told to close off ratelimiter!")

        // weird compiler error that i have to cast this
        // but whatever...
        val mapped = cachedRatelimits.toMap() as Map<String, Any>

        // redo cache
        val newMap = mutableMapOf<String, String>()
        for ((key, value) in mapped) {
            newMap[key] = json.encodeToString(Ratelimit.serializer(), value as Ratelimit)
        }

        if (newMap.isNotEmpty()) {
            redis.commands.hmset("nino:ratelimits", newMap).await()
        }
    }
}
