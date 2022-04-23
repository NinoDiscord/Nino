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

package sh.nino.database.tables

import org.jetbrains.exposed.sql.LongColumnType
import org.jetbrains.exposed.sql.TextColumnType
import sh.nino.database.columns.array
import sh.nino.database.dao.SnowflakeTable

object AutomodTable: SnowflakeTable("automod") {
    var accountAgeThreshold = integer("account_age_threshold").default(4)
    var mentionsThreshold = integer("mentions_threshold").default(4)
    var blacklistedWords = array<String>("blacklisted_words", TextColumnType()).default(arrayOf())
    var omittedChannels = array<Long>("omitted_channels", LongColumnType()).default(arrayOf())
    var omittedUsers = array<Long>("omitted_users", LongColumnType()).default(arrayOf())
    var omittedRoles = array<Long>("omitted_roles", LongColumnType()).default(arrayOf())
    var messageLinks = bool("message_links").default(false)
    var accountAge = bool("account_age").default(false)
    var dehoisting = bool("dehoisting").default(false)
    var shortlinks = bool("shortlinks").default(false)
    var blacklist = bool("blacklist").default(false)
    var toxicity = bool("toxicity").default(false)
    var phishing = bool("phishing").default(false)
    var mentions = bool("mentions").default(false)
    var invites = bool("invites").default(false)
    var spam = bool("spam").default(false)
    var raid = bool("raid").default(false)
}
