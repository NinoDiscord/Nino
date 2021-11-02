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

package sh.nino.discord.core.command.arguments

import kotlin.reflect.KClass

/**
 * Represents an argument to use.
 * @param name The argument's name
 * @param type The [class][KClass] to use that represents this argument.
 * @param optional If the argument is optional, this can be casted to `<type>?`.
 * @param multi If this argument can have multiple values, if so, cast it to `List<Type>`.
 * @param infinite If this argument is infinite, which will return `List<Type>`. This must
 * be at the end of the argument tree.
 */
@Target(AnnotationTarget.VALUE_PARAMETER)
annotation class Arg(
    val name: String,
    val type: KClass<*>,
    val optional: Boolean = false,
    val multi: Boolean = false,
    val infinite: Boolean = false
)
