/*
 * Copyright (c) 2019-2022 Nino
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

package sh.nino.discord.database.tables

import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.LongColumnType
import org.jetbrains.exposed.sql.StringColumnType
import sh.nino.discord.database.SnowflakeTable
import sh.nino.discord.database.columns.array
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
        operator fun get(key: String): LogEvent = values().find { it.key == key } ?: error("Unable to find key '$key' -> LogEvent")
    }
}

object GuildLogging: SnowflakeTable("logging") {
    val ignoreChannels = array<Long>("ignored_channels", LongColumnType()).default(arrayOf())
    val ignoredUsers = array<Long>("ignored_users", LongColumnType()).default(arrayOf())
    val channelId = long("channel_id").nullable().default(null)
    val enabled = bool("enabled").default(false)
    val events = array<LogEvent>(
        "events",
        object: StringColumnType() {
            override fun sqlType(): String = "LogEventEnum"
            override fun valueFromDB(value: Any): LogEvent =
                if (value::class.isSubclassOf(Enum::class)) {
                    value as LogEvent
                } else {
                    LogEvent[value as String]
                }

            override fun nonNullValueToString(value: Any): String = (value as LogEvent).key
        }
    )
}

class LoggingEntity(id: EntityID<Long>): LongEntity(id) {
    companion object: LongEntityClass<LoggingEntity>(GuildLogging)

    var ignoreChannels by GuildLogging.ignoreChannels
    var ignoredUsers by GuildLogging.ignoredUsers
    var channelId by GuildLogging.channelId
    var enabled by GuildLogging.enabled
    var events by GuildLogging.events
}
