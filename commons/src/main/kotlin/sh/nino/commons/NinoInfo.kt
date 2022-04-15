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

package sh.nino.commons

import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.*

@OptIn(ExperimentalSerializationApi::class)
object NinoInfo {
    /**
     * Returns the version of **helm-server**.
     */
    val VERSION: String

    /**
     * Returns the commit SHA of **helm-server** that was built.
     */
    val COMMIT_HASH: String

    /**
     * Returns when **helm-server** was built at.
     */
    val BUILD_DATE: String

    init {
        val stream = this::class.java.getResourceAsStream("/build-info.json")!!
        val data = Json.decodeFromStream(JsonObject.serializer(), stream)

        VERSION = data["version"]?.jsonPrimitive?.content ?: error("Unable to retrieve `version` from build-info.json!")
        COMMIT_HASH = data["commit_sha"]?.jsonPrimitive?.content ?: error("Unable to retrieve `commit.sha` from build-info.json!")
        BUILD_DATE = data["build_date"]?.jsonPrimitive?.content ?: error("Unable to retrieve `build.date` from build-info.json!")
    }
}
