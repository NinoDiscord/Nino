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

package sh.nino.modules.ravy.data

@kotlinx.serialization.Serializable
data class GetUserResult(
    val pronouns: String,
    val bans: List<BanEntry>,
    val trust: Trust,
    val whitelists: List<WhitelistEntry>,
    val rep: List<ReputationEntry>,
    val sentinel: AeroSentinelEntry
)

/**
 * https://docs.ravy.org/share/5bc92059-64ef-4d6d-816e-144b78e97d89/doc/users-TU3mjAioyS#h-trust
 */
@kotlinx.serialization.Serializable
data class Trust(
    /**
     * From 0-6, higher is better, default is 3
     */
    val level: Int,

    /**
     * What the [level] means.
     */
    val label: String
)

/**
 * https://docs.ravy.org/share/5bc92059-64ef-4d6d-816e-144b78e97d89/doc/users-TU3mjAioyS#h-banentry
 */
@kotlinx.serialization.Serializable
data class BanEntry(
    /**
     * Source for where the user was banned
     */
    val provider: String,

    /**
     * Why the user was banned
     */
    val reason: String,

    /**
     * Machine-readable version of the reason - only present for providers
     *
     *    - ravy
     *    - dservices
     */
    val reasonKey: String? = null,

    /**
     * user ID of the responsible moderator, usually a Discord snowflake.
     */
    val moderator: String
)

@kotlinx.serialization.Serializable
data class WhitelistEntry(
    val provider: String,
    val reason: String
)

@kotlinx.serialization.Serializable
data class ReputationEntry(
    val provider: String,
    val score: Double,
    val upvotes: Int,
    val downvotes: Int
)

@kotlinx.serialization.Serializable
data class AeroSentinelEntry(
    val verified: Boolean,
    val id: String? = null
)
