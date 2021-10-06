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

package sh.nino.discord

import sh.nino.discord.core.NinoThreadFactory
import sh.nino.discord.kotlin.logging
import java.util.concurrent.Executors

class NinoBot {
    companion object {
        val executorPool = Executors.newCachedThreadPool(NinoThreadFactory())
    }

    private val logger by logging<NinoBot>()
    val startTime = System.currentTimeMillis()

    suspend fun launch() {
        val runtime = Runtime.getRuntime()
        logger.info("================================")
        logger.info("Displaying runtime info:")
        logger.info("* Free / Total Memory - ${runtime.freeMemory() / 1024L / 1024L}/${runtime.totalMemory() / 1024L / 1024L}MB")
        logger.info("* Max Memory - ${runtime.maxMemory() / 1024L / 1024L}MB")
        logger.info("* JVM Vendor: ${System.getProperty("java.vendor", "<NA>")}")

        // Launch database, migrator, redis, etc etc
    }

    fun addShutdownHook() {}
}
