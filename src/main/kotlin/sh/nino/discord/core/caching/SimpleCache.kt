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

package sh.nino.discord.core.caching

import com.github.benmanes.caffeine.cache.Caffeine
import kotlinx.coroutines.future.await
import kotlinx.serialization.InternalSerializationApi
import kotlinx.serialization.json.Json
import kotlinx.serialization.serializer
import org.redisson.api.RedissonClient
import sh.nino.discord.core.caching.data_types.Automod
import sh.nino.discord.core.database.tables.AutomodEntity
import sh.nino.discord.core.database.transactions.asyncTransaction
import sh.nino.discord.extensions.suspendingAsyncCache
import sh.nino.discord.kotlin.inject
import sh.nino.discord.kotlin.logging
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit
import kotlin.reflect.KClass

/**
 * Represents a simple cache that uses Redis and Caffeine. Once data expires from Caffeine,
 * it is immediately stored in Redis using a hash table.
 */
@OptIn(InternalSerializationApi::class)
class SimpleCache<out V: Any>(private val name: String, private val kClass: KClass<V>) {
    companion object {
        /**
         * Singleton for automod setting cache
         */
        val automod: SimpleCache<Automod> = SimpleCache("automod", Automod::class)
    }

    private val logger by logging<SimpleCache<V>>()
    private val redis by inject<RedissonClient>()
    private val json by inject<Json>()

    private val inMemory = Caffeine.newBuilder()
        .removalListener<Long, V?> { key, value, cause ->
            logger.debug("Key $key was removed because of ${cause.name} (evicted=${if (cause.wasEvicted()) "yes" else "no"})")

            val encoded = json.encodeToString(kClass.serializer(), value!!)
            val cache = redis.getMap<Long, String>("nino:cache")
            cache[key!!] = encoded
        }
        .expireAfterAccess(1L, TimeUnit.HOURS)
        .suspendingAsyncCache { key ->
            when (name) {
                "automod" -> {
                    var automod = asyncTransaction {
                        AutomodEntity.findById(key)
                    }.execute()

                    if (automod == null) {
                        automod = asyncTransaction {
                            AutomodEntity.new(key) {}
                        }.execute()
                    }

                    Automod.fromEntity(automod)
                }
            }

            error("unable to find info from key: $key")
        }

    suspend fun get(key: Long): V? = inMemory[key]?.await()
    fun put(key: Long, value: @UnsafeVariance V) {
        inMemory.put(key, CompletableFuture.completedFuture(value))
    }
}
