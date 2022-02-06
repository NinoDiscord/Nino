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

package sh.nino.discord.api

import io.ktor.application.*
import io.ktor.http.*
import kotlin.reflect.KCallable
import kotlin.reflect.full.callSuspend
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.hasAnnotation
import sh.nino.discord.api.annotations.Route as RouteMeta

class Route(val path: String, val method: HttpMethod, private val callable: KCallable<*>, private val thiz: Any) {
    suspend fun execute(call: ApplicationCall) {
        callable.callSuspend(thiz, call)
    }
}

open class Endpoint(val prefix: String) {
    companion object {
        fun merge(prefix: String, other: String): String {
            if (other == "/") return prefix

            return "${if (prefix == "/") "" else prefix}$other"
        }
    }

    val routes: List<Route>
        get() = this::class.members.filter { it.hasAnnotation<RouteMeta>() }.map {
            val meta = it.findAnnotation<RouteMeta>()!!
            Route(merge(this.prefix, meta.path), HttpMethod.parse(meta.method.uppercase()), it, this)
        }
}
