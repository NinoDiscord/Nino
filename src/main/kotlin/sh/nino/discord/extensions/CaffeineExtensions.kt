package sh.nino.discord.extensions

import com.github.benmanes.caffeine.cache.AsyncLoadingCache
import com.github.benmanes.caffeine.cache.Caffeine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.future.future

suspend inline fun <K: Any, V: Any> Caffeine<Any, Any>.suspendingAsyncCache(
    crossinline loader: suspend (K) -> V
): AsyncLoadingCache<K, V> = buildAsync { key, executor ->
    CoroutineScope(executor.asCoroutineDispatcher()).future { loader(key) }
}
