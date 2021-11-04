package sh.nino.discord.core.database.tables

import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.EnumerationColumnType
import org.jetbrains.exposed.sql.LongColumnType
import org.jetbrains.exposed.sql.StringColumnType
import sh.nino.discord.core.database.columns.array
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

object Logging: LongIdTable("logging") {
    val ignoreChannels = array<Long>("ignore_channels", LongColumnType())
    var ignoredUsers = array<Long>("ignore_users", LongColumnType())
    var channelId = long("channel_id").nullable()
    var enabled = bool("enabled").default(false)
    var guildId = long("guild_id")
//    var events = array<LogEvent>("events", object: StringColumnType() {
//        override fun sqlType(): String = "LogEventEnum"
//        override fun valueFromDB(value: Any): LogEvent =
//            if (value::class.isSubclassOf(Enum::class))
//                value as LogEvent
//            else
//                LogEvent.get(value as String)
//
//        override fun nonNullValueToString(value: Any): String = (value as PunishmentType).key
//    })

    override val primaryKey = PrimaryKey(guildId, name = "PK_Guild_Logging_id")
}

class LoggingEntity(id: EntityID<Long>): LongEntity(id) {
    companion object: LongEntityClass<LoggingEntity>(Logging)

    var ignoreChannels by Logging.ignoreChannels
    var ignoredUsers   by Logging.ignoredUsers
    var channelId      by Logging.channelId
    var enabled        by Logging.enabled
    var guildId        by Logging.guildId
//    var events         by Logging.events
}
