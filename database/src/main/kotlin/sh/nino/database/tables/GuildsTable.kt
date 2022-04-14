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

import org.jetbrains.exposed.sql.VarCharColumnType
import sh.nino.database.columns.array
import sh.nino.database.dao.SnowflakeTable

object GuildsTable: SnowflakeTable("guilds") {
    val usePlainModlogMessage = bool("use_plain_modlog_message").default(false)
    val modlogWebhookUri = text("modlog_webhook_uri").nullable().default(null)
    val noThreadsRoleId = long("no_threads_role_id").nullable().default(null)
    val modlogChannelId = long("modlog_channel_id").nullable().default(null)
    val mutedRoleId = long("muted_role_id").nullable().default(null)
    val language = text("language").default("en_US")
    val prefixes = array<String>("prefixes", VarCharColumnType(25)).default(arrayOf())
}
