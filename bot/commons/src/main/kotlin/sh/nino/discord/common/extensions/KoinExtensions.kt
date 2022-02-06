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

package sh.nino.discord.common.extensions

import org.koin.core.context.GlobalContext
import kotlin.properties.ReadOnlyProperty

/**
 * Injects a singleton into a property.
 * ```kt
 * class Owo {
 *    val kord: Kord by inject()
 * }
 * ```
 */
inline fun <reified T> inject(): ReadOnlyProperty<Any?, T> =
    ReadOnlyProperty<Any?, T> { _, _ ->
        val koin = GlobalContext.get()
        koin.get()
    }

/**
 * Retrieve a singleton from the Koin application without chaining `.get()` methods twice.
 * ```kt
 * val kord: Kord = GlobalContext.retrieve()
 * ```
 */
inline fun <reified T> GlobalContext.retrieve(): T = get().get()

/**
 * Returns a list of singletons that match with type [T].
 * ```kt
 * val commands: List<AbstractCommand> = GlobalContext.retrieveAll()
 * // => List<Command> [ ... ]
 * ```
 */
inline fun <reified T> GlobalContext.retrieveAll(): List<T> = get().getAll()
