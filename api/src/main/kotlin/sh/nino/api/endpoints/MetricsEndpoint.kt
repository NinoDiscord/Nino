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

package sh.nino.api.endpoints

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.prometheus.client.exporter.common.TextFormat
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import sh.nino.modules.Registry
import sh.nino.modules.metrics.MetricsModule
import java.io.StringWriter

class MetricsEndpoint: AbstractEndpoint("/metrics") {
    private val metrics by Registry.inject<MetricsModule>()

    override suspend fun call(call: ApplicationCall) {
        if (metrics == null) {
            call.respond(
                HttpStatusCode.NotFound,
                buildJsonObject {
                    put("success", false)
                    put("message", "Prometheus Metrics is not enabled.")
                }
            )

            return
        }

        val accept = call.request.header("Accept") ?: TextFormat.CONTENT_TYPE_004
        val contentType = TextFormat.chooseContentType(accept)

        val stream = StringWriter()
        stream.use {
            TextFormat.writeFormat(contentType, it, metrics!!.registry.metricFamilySamples())
        }

        call.respondOutputStream(ContentType.parse(contentType), HttpStatusCode.OK) {
            TextFormat.writeFormat(contentType, writer(), metrics!!.registry.metricFamilySamples())
        }
    }
}
