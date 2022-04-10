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

package sh.nino.discord.timeouts

import io.ktor.client.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.serialization.json.Json

data class ClientResources(
    val shutdownAfterSuccess: Boolean = false,
    val coroutineScope: CoroutineScope,
    val httpClient: HttpClient?,
    val eventFlow: MutableSharedFlow<Event>,
    val auth: String,
    val json: Json,
    val uri: String
)

class ClientBuilder {
    lateinit var uri: String

    // exposed for testing, should not be used in prod
    var shutdownAfterSuccess: Boolean = false
    var coroutineScope: CoroutineScope? = null
    var httpClient: HttpClient? = null
    var eventFlow: MutableSharedFlow<Event> = MutableSharedFlow(extraBufferCapacity = Int.MAX_VALUE)
    var auth: String = ""
    var json: Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    @OptIn(DelicateCoroutinesApi::class)
    fun build(): ClientResources {
        check(::uri.isInitialized) { "URI to the timeouts service must be specified." }

        return ClientResources(
            shutdownAfterSuccess,
            coroutineScope ?: GlobalScope,
            httpClient,
            eventFlow,
            auth,
            json,
            uri
        )
    }
}
