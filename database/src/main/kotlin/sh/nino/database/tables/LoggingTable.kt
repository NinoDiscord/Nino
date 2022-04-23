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

import net.perfectdreams.exposedpowerutils.sql.PGEnum
import org.jetbrains.exposed.sql.LongColumnType
import org.jetbrains.exposed.sql.StringColumnType
import sh.nino.database.LogEvent
import sh.nino.database.columns.array
import sh.nino.database.dao.SnowflakeTable
import kotlin.reflect.full.isSubclassOf

object LoggingTable: SnowflakeTable("guild_logging") {
    val ignoreChannels = array<Long>("ignored_channels", LongColumnType()).default(arrayOf())
    val ignoredUsers = array<Long>("ignored_users", LongColumnType()).default(arrayOf())
    val ignoredRoles = array<Long>("ignored_roles", LongColumnType()).default(arrayOf())
    val channelId = long("channel_id").nullable().default(null)
    val enabled = bool("enabled").default(false)
    val events = array<LogEvent>(
        "events",
        object: StringColumnType() {
            /** Returns the SQL type of this column. */
            override fun sqlType(): String = LogEvent::class.simpleName!!.lowercase()
            override fun notNullValueToDB(value: Any): Any = PGEnum(LogEvent::class.simpleName!!.lowercase(), value as LogEvent)
            override fun valueFromDB(value: Any): Any =
                if (value::class.isSubclassOf(Enum::class)) value as LogEvent else enumValueOf<LogEvent>(value as String)
        }
    )
}
