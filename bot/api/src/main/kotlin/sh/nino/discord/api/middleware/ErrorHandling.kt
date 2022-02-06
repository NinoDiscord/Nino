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

package sh.nino.discord.api.middleware

import io.ktor.application.*
import io.ktor.util.*
import io.sentry.Sentry

class ErrorHandling {
    companion object: ApplicationFeature<ApplicationCallPipeline, Unit, ErrorHandling> {
        override val key: AttributeKey<ErrorHandling> = AttributeKey("ErrorHandling")
        override fun install(pipeline: ApplicationCallPipeline, configure: Unit.() -> Unit): ErrorHandling {
            pipeline.intercept(ApplicationCallPipeline.Call) {
                try {
                    proceed()
                } catch (e: Exception) {
                    if (Sentry.isEnabled()) Sentry.captureException(e)

                    throw e
                }
            }

            return ErrorHandling()
        }
    }
}
