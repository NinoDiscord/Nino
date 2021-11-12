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
import sh.nino.discord.core.database.tables.dao.SnowflakeTable

object Punishments: SnowflakeTable("punishments") {
    var warnings = integer("warnings").default(1)
    var index = integer("index").autoIncrement()
    var soft = bool("soft").default(false)
    var time = long("time").nullable()
    var days = integer("days").nullable()
    val type = GuildCases.customEnumeration(
        "type",
        "PunishmentTypeEnum",
        { value -> PunishmentType.get(value as String) },
        { toDb -> toDb.key }
    )

    override val primaryKey: PrimaryKey = PrimaryKey(id, index, name = "PK_GuildPunishments_ID")
}

class PunishmentsEntity(id: EntityID<Long>): LongEntity(id) {
    companion object: LongEntityClass<PunishmentsEntity>(Punishments)

    var warnings by Punishments.warnings
    var index by Punishments.index
    var soft by Punishments.soft
    var time by Punishments.time
    var days by Punishments.days
    var type by Punishments.type
}
