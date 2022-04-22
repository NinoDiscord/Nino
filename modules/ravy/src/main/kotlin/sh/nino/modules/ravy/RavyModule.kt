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

package sh.nino.modules.ravy

import io.ktor.client.*
import io.ktor.client.request.*
import sh.nino.modules.annotations.ModuleMeta
import sh.nino.modules.ravy.data.GetUserResult

/**
 * Represents the module for interacting with the [ravy.org](https://ravy.org) API.
 */
@ModuleMeta("ravy", "Module to interact with the ravy.org API, used for automod")
class RavyModule(private val token: String, private val httpClient: HttpClient) {
    suspend fun getUserData(id: String): GetUserResult = httpClient.get("https://ravy.org/api/v1/users/$id") {
        header("Authorization", token)
        header("Accept", "application/json; charset=utf-8")
    }
}
