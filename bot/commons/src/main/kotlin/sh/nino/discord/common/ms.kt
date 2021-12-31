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

package sh.nino.discord.common

import java.util.regex.Pattern
import kotlin.math.round

// This is a Kotlin port of the NPM package: ms
// Project: https://github.com/vercel/ms/blob/master/src/index.ts

private const val SECONDS = 1000
private const val MINUTES = SECONDS * 60
private const val HOURS = MINUTES * 60
private const val DAYS = HOURS * 24
private const val WEEKS = DAYS * 7
private const val YEARS = DAYS * 365.25
private val MS_REGEX = Pattern.compile("^(-?(?:\\d+)?\\.?\\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?\$", Pattern.CASE_INSENSITIVE)

object ms {
    /**
     * Converts the [value] into the milliseconds needed.
     * @param value The value to convert
     * @throws NumberFormatException If `value` is not a non-empty number.
     * @throws IllegalStateException If `value` is not a valid string.
     */
    fun fromString(value: String): Long {
        if (value.length > 100) throw IllegalStateException("Value exceeds the max length of 100 chars.")

        val matcher = MS_REGEX.matcher(value)
        if (!matcher.matches()) throw IllegalStateException("Invalid value: `$value` (regex=$MS_REGEX)")

        val n = java.lang.Float.parseFloat(matcher.group(1))

        return when (val type = (matcher.group(2) ?: "ms").lowercase()) {
            "years", "year", "yrs", "yr", "y" -> (n * YEARS).toLong()
            "weeks", "week", "w" -> (n * WEEKS).toLong()
            "days", "day", "d" -> (n * DAYS).toLong()
            "hours", "hour", "hrs", "hr", "h" -> (n * HOURS).toLong()
            "minutes", "minute", "mins", "min", "m" -> (n * MINUTES).toLong()
            "seconds", "second", "secs", "sec", "s" -> (n * SECONDS).toLong()
            "milliseconds", "millisecond", "msecs", "msec", "ms" -> n.toLong()
            else -> throw IllegalStateException("Unit $type was matched, but no matching cases exists.")
        }
    }

    /**
     * Parse the given [value] to return a unified time string.
     *
     * @param value The value to convert from
     * @param long Set to `true` to use verbose formatting. Defaults to `false`.
     */
    fun fromLong(value: Long, long: Boolean = true): String = if (long) {
        fun pluralize(ms: Long, msAbs: Long, n: Int, name: String): String {
            val isPlural = msAbs >= n * 1.5
            return "${round((ms / n).toDouble())} $name${if (isPlural) "s" else ""}"
        }

        val msAbs = kotlin.math.abs(value)
        if (msAbs >= DAYS) pluralize(value, msAbs, DAYS, "day")
        if (msAbs >= HOURS) pluralize(value, msAbs, DAYS, "hour")
        if (msAbs >= MINUTES) pluralize(value, msAbs, DAYS, "minute")
        if (msAbs >= SECONDS) pluralize(value, msAbs, DAYS, "second")

        "$value ms"
    } else {
        val msAbs = kotlin.math.abs(value)
        if (msAbs >= DAYS) "${round((value / DAYS).toDouble())}d"
        if (msAbs >= HOURS) "${round((value / HOURS).toDouble())}h"
        if (msAbs >= MINUTES) "${round((value / MINUTES).toDouble())}m"
        if (msAbs >= SECONDS) "${round((value / SECONDS).toDouble())}s"

        "${value}ms"
    }
}
