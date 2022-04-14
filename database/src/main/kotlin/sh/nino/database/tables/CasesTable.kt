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

import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import net.perfectdreams.exposedpowerutils.sql.postgresEnumeration
import org.jetbrains.exposed.sql.TextColumnType
import org.jetbrains.exposed.sql.kotlin.datetime.datetime
import sh.nino.database.PunishmentType
import sh.nino.database.columns.array
import sh.nino.database.dao.SnowflakeTable

object CasesTable: SnowflakeTable("guild_cases") {
    val attachments = array<String>("attachments", TextColumnType()).default(arrayOf())
    val moderatorId = long("moderator_id")
    val messageId = long("message_id").nullable()
    val createdAt = datetime("created_at").default(Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()))
    val updatedAt = datetime("updated_at").default(Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()))
    val victimId = long("victim_id")
    val reason = text("reason").nullable()
    val index = integer("index").autoIncrement()
    val soft = bool("soft").default(false)
    val time = long("time").nullable().default(null)
    val type = postgresEnumeration<PunishmentType>("type")

    override val primaryKey: PrimaryKey = PrimaryKey(id, index, name = "PK_GuildCases_ID")
}
