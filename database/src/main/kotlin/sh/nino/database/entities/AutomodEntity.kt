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

package sh.nino.database.entities

import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import sh.nino.database.tables.AutomodTable

class AutomodEntity(id: EntityID<Long>): LongEntity(id) {
    companion object: LongEntityClass<AutomodEntity>(AutomodTable)

    var accountAgeThreshold by AutomodTable.accountAgeThreshold
    var mentionThreshold by AutomodTable.mentionsThreshold
    var blacklistedWords by AutomodTable.blacklistedWords
    var omittedChannels by AutomodTable.omittedChannels
    var omittedRoles by AutomodTable.omittedRoles
    var omittedUsers by AutomodTable.omittedUsers
    var messageLinks by AutomodTable.messageLinks
    val accountAge by AutomodTable.accountAge
    var dehoisting by AutomodTable.dehoisting
    var shortlinks by AutomodTable.shortlinks
    var blacklist by AutomodTable.blacklist
    var toxicity by AutomodTable.toxicity
    var phishing by AutomodTable.phishing
    var mentions by AutomodTable.mentions
    var invites by AutomodTable.invites
    var spam by AutomodTable.spam
    var raid by AutomodTable.raid
}
