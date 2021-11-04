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
import org.jetbrains.exposed.sql.VarCharColumnType
import sh.nino.discord.core.database.columns.array
import sh.nino.discord.core.database.tables.dao.SnowflakeTable

object Guilds: SnowflakeTable("guilds") {
    val noThreadsRoleId = long("no_threads_role_id").nullable()
    val modlogChannelId = long("modlog_channel_id").nullable()
    val mutedRoleId = long("muted_role_id").nullable()
    val prefixes = array<String>("prefixes", VarCharColumnType(25))
    val language = text("language").default("en_US")
}

class GuildEntity(id: EntityID<Long>): LongEntity(id) {
    companion object: LongEntityClass<GuildEntity>(Guilds)

    var noThreadsRoleId by Guilds.noThreadsRoleId
    var modlogChannelId by Guilds.modlogChannelId
    var mutedRoleId by Guilds.mutedRoleId
    var prefixes by Guilds.prefixes
    var language by Guilds.language
}
