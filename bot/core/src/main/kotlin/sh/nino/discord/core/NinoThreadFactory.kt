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

package sh.nino.discord.core

import kotlinx.atomicfu.atomic
import java.util.concurrent.ThreadFactory

object NinoThreadFactory: ThreadFactory {
    private val threadIdCounter = atomic(0)
    private val threadGroup: ThreadGroup by lazy {
        // TODO: move to Thread.currentThread().threadGroup
        val security = System.getSecurityManager()

        if (security != null && security.threadGroup != null) {
            security.threadGroup
        } else {
            Thread.currentThread().threadGroup
        }
    }

    override fun newThread(r: Runnable): Thread {
        val name = "Nino-ExecutorThread[${threadIdCounter.incrementAndGet()}]"
        val thread = Thread(threadGroup, r, name)

        if (thread.priority != Thread.NORM_PRIORITY)
            thread.priority = Thread.NORM_PRIORITY

        return thread
    }
}
