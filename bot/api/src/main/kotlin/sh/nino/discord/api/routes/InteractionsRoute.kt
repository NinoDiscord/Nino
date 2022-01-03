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

@file:Suppress("UNUSED")
package sh.nino.discord.api.routes

import gay.floof.utils.slf4j.logging
import io.ktor.application.*
import io.ktor.response.*
import sh.nino.discord.api.Endpoint
import sh.nino.discord.api.annotations.Route
import sh.nino.discord.common.data.Config

private data class Response(
    val message: String
)

class InteractionsRoute(private val config: Config): Endpoint("/interactions") {
    private val logger by logging<InteractionsRoute>()

    @Route(path = "/", method = "GET")
    suspend fun get(call: ApplicationCall) {
        call.respond(Response(message = "hello world"))
    }

    @Route("/receive", method = "POST")
    suspend fun interactions(call: ApplicationCall) {
        logger.info("Received interaction request!")
    }
}
