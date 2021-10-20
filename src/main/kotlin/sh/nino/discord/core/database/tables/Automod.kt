/**
 * Copyright (c) 2019-2021 Nino
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

package sh.nino.discord.core.database.tables

import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.TextColumnType
import org.jetbrains.exposed.sql.VarCharColumnType
import sh.nino.discord.core.database.columns.array

object AutomodTable: LongIdTable("automod") {
    val mentionsThreshold = integer("mentions_threshold").default(4)
    val blacklistedWords = array<String>("blacklisted_words", TextColumnType()).default(arrayOf())
    val omittedChannels = array<String>("omitted_channels", TextColumnType()).default(arrayOf())
    val omittedUsers = array<String>("omitted_users", VarCharColumnType(18))
    val messageLinks = bool("message_links").default(false)
    val dehoisting = bool("dehoisting").default(false)
    val shortlinks = bool("shortlinks").default(false)
    val blacklist = bool("blacklist").default(false)
    val mentions = bool("mentions").default(false)
    val guildId = long("guild_id")
    val invites = bool("invites").default(false)
    val spam = bool("spam").default(false)
    val raid = bool("raid").default(false)

    override val primaryKey = PrimaryKey(guildId, name = "PK_Automod_ID")
}

class AutomodEntity(id: EntityID<Long>): LongEntity(id) {
    companion object: LongEntityClass<AutomodEntity>(AutomodTable)

    var mentionThreshold by AutomodTable.mentionsThreshold
    var blacklistedWords by AutomodTable.blacklistedWords
    var omittedChannels by AutomodTable.omittedChannels
    var omittedUsers by AutomodTable.omittedUsers
    var messageLinks by AutomodTable.messageLinks
    var dehoisting by AutomodTable.dehoisting
    var shortlinks by AutomodTable.shortlinks
    var blacklist by AutomodTable.blacklist
    var mentions by AutomodTable.mentions
    var guildId by AutomodTable.guildId
    var invites by AutomodTable.invites
    var spam by AutomodTable.spam
    var raid by AutomodTable.raid
}
