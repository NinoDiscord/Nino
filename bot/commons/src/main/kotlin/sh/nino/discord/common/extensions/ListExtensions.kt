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

package sh.nino.discord.common.extensions

/**
 * This extension creates a new [Map] of a [List] with [Pair]s.
 * ```kt
 * val owo = listOf(Pair("first", "second"), Pair("third", "fourth"))
 * owo.asMap()
 * // { "first": "second", "third": "fourth" }
 * ```
 */
fun <T, U> List<Pair<T, U>>.asMap(): Map<T, U> {
    val map = mutableMapOf<T, U>()
    for (item in this) {
        map[item.first] = item.second
    }

    return map.toMap()
}

/**
 * This extension returns a [Pair] from a list which the first item
 * is from [List.first] while the second item is a [List] of the underlying
 * data left over.
 */
fun <T> List<T>.pairUp(): Pair<T, List<T>> = Pair(first(), drop(1))

/**
 * Returns a [Boolean] if every element appears to be true from the [predicate] function.
 */
fun <T> List<T>.every(predicate: (T) -> Boolean): Boolean {
    for (item in this) {
        if (!predicate(item)) return false
    }

    return true
}

/**
 * Returns the index of an item from a [predicate] function.
 * @param predicate The lambda function to find the item you need.
 * @return If the item was found, it'll return the index in the [List],
 * or -1 if nothing was found.
 */
fun <T> List<T>.findIndex(predicate: (T) -> Boolean): Int {
    for ((index, item) in this.withIndex()) {
        if (predicate(item))
            return index
    }

    return -1
}

/**
 * Returns the index of an item from a [predicate] function.
 * @param predicate The lambda function to find the item you need.
 * @return If the item was found, it'll return the index in the [List],
 * or -1 if nothing was found.
 */
fun <T> Array<T>.findIndex(predicate: (T) -> Boolean): Int = this.toList().findIndex(predicate)

fun <T> List<T>.removeFirst(): List<T> = drop(1)
