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

package sh.nino.discord.modules.punishments

fun <A, B> unionOf(first: A, second: B): Union<A, B> = Union.from(first, second)
fun <A, B> nullUnionOf(first: A, second: B?): Union<A, B?> = Union.fromNull(first, second)

class Union<out A, out B>(private val first: UnionA<A>, private val second: UnionB<B>) {
    class UnionA<out A>(val value: A)
    class UnionB<out B>(val value: B)

    companion object {
        fun <A, B> fromNull(first: A, second: B?) = Union(UnionA(first), UnionB(second))
        fun <A, B> from(first: A, second: B) = Union(UnionA(first), UnionB(second))
    }

    operator fun component1(): A = first.value
    operator fun component2(): B = second.value
}
