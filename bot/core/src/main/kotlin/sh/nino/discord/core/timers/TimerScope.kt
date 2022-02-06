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

package sh.nino.discord.core.timers

import gay.floof.utils.slf4j.logging
import kotlinx.coroutines.*
import sh.nino.discord.core.NinoThreadFactory
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.coroutines.CoroutineContext

/**
 * The timer scope is a coroutine scope that uses a single-threaded executor pool,
 * that it can be easily used with kotlinx.coroutines!
 */
internal class TimerScope: CoroutineScope {
    private val executorPool: ExecutorService = Executors.newSingleThreadExecutor(NinoThreadFactory)
    private val logger by logging<TimerScope>()

    override val coroutineContext: CoroutineContext = SupervisorJob() + executorPool.asCoroutineDispatcher()
    fun launch(job: TimerJob): Job {
        return launch(start = CoroutineStart.LAZY) {
            delay(job.interval.toLong())
            while (isActive) {
                try {
                    job.execute()
                } catch (e: Exception) {
                    logger.error("Unable to run job '${job.name}':", e)
                }

                delay(job.interval.toLong())
            }
        }
    }
}
