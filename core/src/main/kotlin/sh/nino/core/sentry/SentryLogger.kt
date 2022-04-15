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

package sh.nino.core.sentry

import gay.floof.utils.slf4j.logging
import io.sentry.ILogger
import io.sentry.SentryLevel

class SentryLogger(private val debug: Boolean): ILogger {
    private val log by logging<SentryLogger>()

    /**
     * Logs a message with the specified level, message and optional arguments.
     *
     * @param level The SentryLevel.
     * @param message The message.
     * @param args The optional arguments to format the message.
     */
    override fun log(level: SentryLevel, message: String, vararg args: Any?) {
        if (!isEnabled(level)) return

        return when (level) {
            SentryLevel.WARNING -> log.warn(message, args)
            SentryLevel.DEBUG -> log.debug(message, args)
            SentryLevel.ERROR -> log.error(message, args)
            SentryLevel.FATAL -> log.error(message, args)
            SentryLevel.INFO -> log.info(message, args)
        }
    }

    /**
     * Logs a message with the specified level, message and optional arguments.
     *
     * @param level The SentryLevel.
     * @param message The message.
     * @param throwable The throwable to log.
     */
    override fun log(level: SentryLevel, message: String, throwable: Throwable?) {
        if (!isEnabled(level)) return

        return when (level) {
            SentryLevel.ERROR -> log.error(message, throwable)
            SentryLevel.FATAL -> log.error(message, throwable)
            else -> {} // nop
        }
    }

    /**
     * Logs a message with the specified level, throwable, message and optional arguments.
     *
     * @param level The SentryLevel.
     * @param throwable The throwable to log.
     * @param message The message.
     * @param args the formatting arguments
     */
    override fun log(level: SentryLevel, throwable: Throwable?, message: String, vararg args: Any?) {
        if (!isEnabled(level)) return

        return when (level) {
            SentryLevel.ERROR -> log.error(message, throwable, args)
            SentryLevel.FATAL -> log.error(message, throwable, args)
            else -> {} // nop
        }
    }

    /**
     * Whether this logger is enabled for the specified SentryLevel.
     *
     * @param level The SentryLevel to test against.
     * @return True if a log message would be recorded for the level. Otherwise false.
     */
    override fun isEnabled(level: SentryLevel?): Boolean = when (level) {
        SentryLevel.DEBUG -> debug
        else -> true
    }
}
