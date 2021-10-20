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
import sh.nino.discord.core.database.columns.array

enum class PunishmentType {
    THREAD_MESSAGES_REMOVED,
    THREAD_MESSAGES_ADDED,
    WARNING_REMOVED,
    VOICE_UNDEAFEN,
    WARNING_ADDED,
    VOICE_UNMUTED,
    VOICE_DEAFEN,
    VOICE_UNMUTE,
    VOICE_MUTE,
    UNBAN,
    MUTE,
    KICK,
    BAN
}

object GuildCases: LongIdTable("guild_cases") {
    val attachments = array<String>("attachments", TextColumnType()).default(arrayOf())
    val moderatorId = varchar("moderator_id", 18)
    val messageId = varchar("message_id", 18).nullable()
    val victimId = varchar("victim_id", 18)
    val guildId = long("guild_id")
    val reason = text("reason").nullable()
    val index = integer("index")
    val type = enumeration("type", PunishmentType::class)
    val soft = bool("soft").default(false)
    val time = long("time").nullable().default(null)

    override val primaryKey: PrimaryKey = PrimaryKey(guildId, index, name = "PK_GuildCases_ID")
}

class GuildCasesEntity(id: EntityID<Long>): LongEntity(id) {
    companion object: LongEntityClass<GuildCasesEntity>(GuildCases)

    var attachments by GuildCases.attachments
    var moderatorId by GuildCases.moderatorId
    var messageId by GuildCases.messageId
    var victimId by GuildCases.victimId
    var guildId by GuildCases.guildId
    var reason by GuildCases.reason
    var index by GuildCases.index
    var type by GuildCases.type
    var soft by GuildCases.soft
    var time by GuildCases.time
}
