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

package sh.nino.discord.common.extensions

/**
 * Format this [Long] into a readable byte format.
 */
fun Long.formatSize(): String {
    val kilo = this / 1024L
    val mega = kilo / 1024L
    val giga = mega / 1024L

    return when {
        kilo < 1024 -> "${kilo}KB"
        mega < 1024 -> "${mega}MB"
        else -> "${giga}GB"
    }
}

/**
 * Returns the humanized time for a [java.lang.Long] instance
 * @credit // Credit: https://github.com/DV8FromTheWorld/Yui/blob/master/src/main/java/net/dv8tion/discord/commands/UptimeCommand.java#L34
 */
fun Long.humanize(): String {
    val months = this / 2592000000L % 12
    val weeks = this / 604800000L % 7
    val days = this / 86400000L % 30
    val hours = this / 3600000L % 24
    val minutes = this / 60000L % 60
    val seconds = this / 1000L % 60

    val str = StringBuilder()
    if (months > 0) str.append("${months}mo")
    if (weeks > 0) str.append("${weeks}w")
    if (days > 0) str.append("${days}d")
    if (hours > 0) str.append("${hours}h")
    if (minutes > 0) str.append("${minutes}m")
    if (seconds > 0) str.append("${seconds}s")

    return str.toString()
}
