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

package sh.nino.commons.data

import kotlinx.serialization.*

/**
 * Represents the configuration for the API, which is a standalone
 * application.
 */
@Serializable
data class APIConfig(
    /**
     * If we should add additional security headers to the response.
     */
    @SerialName("security_headers")
    val securityHeaders: Boolean = true,

    /**
     * Size of the queue to store all the application call instances
     * that cannot be immediately processed.
     */
    @SerialName("request_queue_limit")
    val requestQueueLimit: Int = 16,

    /**
     * Number of concurrently running requests from the same HTTP pipeline
     */
    @SerialName("running_limit")
    val runningLimit: Int = 10,

    /**
     * Do not create separate call event groups and reuse worker
     * groups for processing calls.
     */
    @SerialName("share_work_group")
    val shareWorkGroup: Boolean = false,

    /**
     * Timeout in seconds for sending responses to the client.
     */
    @SerialName("response_write_timeout")
    val responseWriteTimeoutSeconds: Int = 10,

    /**
     * Timeout in seconds to read incoming requests from the client, "0" = infinite.
     */
    @SerialName("request_read_timeout")
    val requestReadTimeout: Int = 0,

    /**
     * If this is set to `true`, this will enable TCP keep alive for
     * connections that are so-called "dead" and can be easily discarded.
     *
     * The timeout period is configured by the system, so configure
     * the end host accordingly.
     */
    @SerialName("keep_alive")
    val tcpKeepAlive: Boolean = false,

    /**
     * Append extra headers when sending out a response.
     */
    val extraHeaders: Map<String, String> = mapOf(),

    /**
     * The host address to use when creating a TCP listener.
     */
    val host: String = "0.0.0.0",

    /**
     * The port of the address to use when creating a TCP listener.
     */
    val port: Int = 9393
)
