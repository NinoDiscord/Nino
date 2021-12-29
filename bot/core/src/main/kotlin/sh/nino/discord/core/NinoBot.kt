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

package sh.nino.discord.core

import gay.floof.utils.slf4j.logging
import java.lang.management.ManagementFactory
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import kotlin.concurrent.thread

class NinoBot {
    private val logger by logging<NinoBot>()
    val bootTime = System.currentTimeMillis()

    init {
        addShutdownHook()
    }

    suspend fun start() {
        val runtime = Runtime.getRuntime()
        val os = ManagementFactory.getOperatingSystemMXBean()
        val threads = ManagementFactory.getThreadMXBean()

        val free = runtime.freeMemory() / 1024L / 1024L
        val total = runtime.totalMemory() / 1024L / 1024L
        val maxMem = runtime.maxMemory() / 1024L / 1024L

        logger.info("[+~+ | Runtime Information | +~+]")
        logger.info("* Free / Total (Max) Memory: ${free}MiB/${total}MiB (${maxMem}MiB)")
        logger.info("* Threads: ${threads.threadCount} (${threads.daemonThreadCount} daemon'd)")
        logger.info("* JVM: ${System.getProperty("java.version")} (${System.getProperty("java.vendor", "<NA>")})")
        logger.info("* Kotlin: ${KotlinVersion.CURRENT}")
        logger.info("* Operating System: ${os.name} with ${os.availableProcessors} processors (${os.arch}; ${os.version}")
    }

    private fun addShutdownHook() {
        logger.info("Adding shutdown hook...")

        val runtime = Runtime.getRuntime()
        runtime.addShutdownHook(
            thread(false, name = "Nino-ShutdownThread") {
                logger.warn("Shutting down...")
            }
        )
    }

    companion object {
        val executorPool: Executor = Executors.newCachedThreadPool(NinoThreadFactory)
        val dediNode by lazy {
            // Check in properties (most likely in production)
            val dediNode1 = System.getProperty("winterfox.dedi", "?")
            if (dediNode1 != "?") {
                return@lazy dediNode1
            }

            // Check in environment variables
            val dediNode2 = System.getenv("WINTERFOX_DEDI_NODE") ?: ""
            if (dediNode2 != "") {
                return@lazy dediNode2
            }

            null
        }
    }
}
