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
import io.ktor.utils.io.*
import kotlin.time.Duration.Companion.seconds

/**
 * The timer manager is the main manager to schedule and unschedule all the timers
 * that were registered.
 */
class TimerManager {
    private val scope = TimerScope()
    private val logger by logging<TimerManager>()
    private val jobs: MutableList<TimerJob> = mutableListOf()

    fun schedule(job: TimerJob) {
        logger.info("Scheduled job ${job.name} for every ${job.interval.seconds} seconds!")
        val coroutineJob = scope.launch(job)

        job.coroutineJob = coroutineJob
        coroutineJob.start()

        jobs.add(job)
    }

    fun bulkSchedule(vararg jobs: TimerJob) {
        for (job in jobs) schedule(job)
    }

    fun unschedule() {
        logger.warn("Unscheduled all timer jobs...")
        for (job in jobs) job.coroutineJob!!.cancel(CancellationException("Unscheduled by program"))
    }
}
