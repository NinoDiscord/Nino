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
import org.jetbrains.exposed.sql.LongColumnType
import org.jetbrains.exposed.sql.StringColumnType
import sh.nino.discord.core.database.columns.array
import sh.nino.discord.core.database.tables.dao.SnowflakeTable
import kotlin.reflect.full.isSubclassOf

enum class LogEvent(val key: String) {
    VoiceMemberDeafen("voice member deafen"),
    VoiceChannelLeave("voice channel leave"),
    VoiceChannelSwitch("voice channel switch"),
    VoiceChannelJoin("voice channel join"),
    VoiceMemberMuted("voice member muted"),
    MessageUpdated("message updated"),
    MessageDeleted("message deleted"),
    MemberBoosted("member boosted"),
    ThreadCreated("thread created"),
    ThreadDeleted("thread deleted");

    companion object {
        fun get(key: String): LogEvent = values().find { it.key == key } ?: error("Unable to find key '$key' -> LogEvent")
    }
}

object Logging: SnowflakeTable("logging") {
    val ignoreChannels = array<Long>("ignore_channels", LongColumnType())
    var ignoredUsers = array<Long>("ignore_users", LongColumnType())
    var channelId = long("channel_id").nullable()
    var enabled = bool("enabled").default(false)
    var events = array<LogEvent>(
        "events",
        object: StringColumnType() {
            override fun sqlType(): String = "LogEventEnum"
            override fun valueFromDB(value: Any): LogEvent =
                if (value::class.isSubclassOf(Enum::class))
                    value as LogEvent
                else
                    LogEvent.get(value as String)

            override fun nonNullValueToString(value: Any): String = (value as PunishmentType).key
        }
    )
}

class LoggingEntity(id: EntityID<Long>): LongEntity(id) {
    companion object: LongEntityClass<LoggingEntity>(Logging)

    var ignoreChannels by Logging.ignoreChannels
    var ignoredUsers by Logging.ignoredUsers
    var channelId by Logging.channelId
    var enabled by Logging.enabled
    var events by Logging.events
}
