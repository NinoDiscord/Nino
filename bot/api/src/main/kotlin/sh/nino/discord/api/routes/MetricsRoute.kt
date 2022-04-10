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

@file:Suppress("UNUSED")
package sh.nino.discord.api.routes

import io.ktor.application.*
import io.ktor.http.*
import io.ktor.response.*
import io.prometheus.client.exporter.common.TextFormat
import sh.nino.discord.api.Endpoint
import sh.nino.discord.api.annotations.Route
import sh.nino.discord.common.data.Config
import sh.nino.discord.metrics.MetricsRegistry

class MetricsRoute(private val config: Config, private val metrics: MetricsRegistry): Endpoint("/metrics") {
    @Route("/", method = "GET")
    suspend fun metrics(call: ApplicationCall) {
        if (!config.metrics)
            return call.respondText("Cannot GET /metrics", status = HttpStatusCode.NotFound)

        call.respondTextWriter(ContentType.parse(TextFormat.CONTENT_TYPE_004), HttpStatusCode.OK) {
            TextFormat.write004(this, metrics.registry!!.metricFamilySamples())
        }
    }
}
