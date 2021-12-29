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

package sh.nino.discord.database.tables

import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.kotlin.datetime.datetime
import sh.nino.discord.database.SnowflakeTable

enum class BanType(val key: String) {
    GUILD("guild"),
    USER("user");

    companion object {
        fun find(key: String): BanType =
            values().find { it.key == key } ?: error("Unable to find '$key' -> BanType")
    }
}

object GlobalBansTable: SnowflakeTable("global_bans") {
    val createdAt = datetime("created_at").default(Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()))
    val expireAt = long("expire_at").nullable()
    val reason = varchar("reason", 256).nullable()
    val issuer = long("issuer")
    val type = customEnumeration(
        "type",
        "BanTypeEnum",
        { value -> BanType.find(value as String) },
        { toDb -> toDb.key }
    )
}

class GlobalBans(id: EntityID<Long>): LongEntity(id) {
    companion object: LongEntityClass<GlobalBans>(GlobalBansTable)

    var createdAt by GlobalBansTable.createdAt
    var expireAt by GlobalBansTable.expireAt
    var reason by GlobalBansTable.reason
    var issuer by GlobalBansTable.issuer
    var type by GlobalBansTable.type
}
