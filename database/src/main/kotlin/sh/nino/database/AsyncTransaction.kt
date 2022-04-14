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

package sh.nino.database

import io.sentry.Sentry
import io.sentry.kotlin.SentryContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.future.await
import kotlinx.coroutines.future.future
import org.jetbrains.exposed.sql.Transaction
import org.jetbrains.exposed.sql.transactions.transaction
import kotlin.coroutines.CoroutineContext

/**
 * Represents an asynchronous [transaction][Transaction].
 */
class AsyncTransaction<T>(val block: Transaction.() -> T) {
    /**
     * Executes the [block] that was passed down to be executed. This will report
     * any errors towards Sentry if the coroutine has failed to execute.
     *
     * @return The represented object of this [transaction][AsyncTransaction]
     */
    @OptIn(DelicateCoroutinesApi::class)
    suspend fun execute(): T {
        // TODO: use NinoScope.coroutineContext for fun
        var coroutineContext: CoroutineContext = GlobalScope.coroutineContext

        if (Sentry.isEnabled()) {
            val newCtx = SentryContext() + coroutineContext
            coroutineContext = newCtx
        }

        return CoroutineScope(coroutineContext).future {
            transaction { block() }
        }.await()
    }
}

/**
 * Creates a new [AsyncTransaction] and executes the [block]. If Sentry is enabled,
 * this will report any errors to Sentry if the coroutine has failed.
 */
suspend fun <T> asyncTransaction(block: Transaction.() -> T): T = AsyncTransaction(block).execute()
