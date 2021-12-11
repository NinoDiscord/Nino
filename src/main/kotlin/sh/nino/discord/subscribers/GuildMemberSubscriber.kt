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

package sh.nino.discord.subscribers

import dev.kord.common.entity.AuditLogEvent
import dev.kord.common.entity.DiscordAuditLogEntry
import dev.kord.common.entity.Permission
import dev.kord.common.entity.Snowflake
import dev.kord.core.Kord
import dev.kord.core.entity.Member
import dev.kord.core.event.guild.MemberJoinEvent
import dev.kord.core.event.guild.MemberLeaveEvent
import dev.kord.core.event.guild.MemberUpdateEvent
import dev.kord.core.firstOrNull
import dev.kord.core.on
import dev.kord.rest.json.request.AuditLogGetRequest
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import org.koin.core.context.GlobalContext
import org.slf4j.LoggerFactory
import sh.nino.discord.core.automod.AutomodContainer
import sh.nino.discord.core.database.tables.*
import sh.nino.discord.extensions.contains
import sh.nino.discord.extensions.createdAt
import sh.nino.discord.extensions.sort

private suspend fun getAuditLogEntriesOf(
    kord: Kord,
    self: Member,
    guildId: Snowflake,
    userId: Snowflake,
    action: AuditLogEvent
): DiscordAuditLogEntry? {
    val perms = self.getPermissions()
    if (!perms.contains(Permission.ViewAuditLog)) return null

    val auditLogs = kord.rest.auditLog.getAuditLogs(
        guildId,
        AuditLogGetRequest(
            userId,
            limit = 3,
            action = action
        )
    )

    return auditLogs
        .auditLogEntries
        .sort { a, b -> b.id.createdAt.toEpochMilli().toInt() - a.id.createdAt.toEpochMilli().toInt() }
        .firstOrNull()
}

suspend fun Kord.applyGuildMemberEvents() {
    val logger = LoggerFactory.getLogger("sh.nino.discord.subscribers.GuildMemberSubscriber")
    val koin = GlobalContext.get()
    val automodContainer = koin.get<AutomodContainer>()

    on<MemberJoinEvent> {
        val guild = this.getGuild()
        val user = this.member.asUser()

        logger.info("User ${user.tag} has joined ${guild.name} (${guild.id.asString}) - applying automod...")
        val executed = automodContainer.execute(this)
        if (executed) return@on

        val cases = transaction {
            GuildCasesEntity.find {
                (GuildCases.id eq guild.id.value.toLong()) and (GuildCases.victimId eq user.id.value.toLong())
            }
        }

        // If there was no previous cases, let's just not skip it.
        if (cases.empty()) return@on

        // Check if the last punishment was a mute, assuming they left
        // and joined.
        val last = (try { cases.last() } catch (e: Exception) { null }) ?: return@on
        if (last.type == PunishmentType.MUTE) {
            // apply shit here
        }
    }

    on<MemberLeaveEvent> {
        val guild = this.getGuild()
        logger.info("User ${this.user.tag} has left ${guild.name} (${guild.id.asString}) - checking if user was kicked...")

        val member = guild.members.firstOrNull { it.id == kord.selfId } ?: return@on
        val perms = member.getPermissions()

        if (!perms.contains(Permission.ViewAuditLog)) return@on

        // there is no real way to get only logs; not entries inside the logs
        // so, we're going to be using rest here :3
        val auditLogs = kord.rest.auditLog.getAuditLogs(
            guild.id,
            AuditLogGetRequest(
                limit = 3,
                action = AuditLogEvent.MemberKick
            )
        )

        val found = auditLogs
            .auditLogEntries
            // this looks horrendous but whatever
            .sort { a, b -> (b.id.createdAt.toEpochMilli() - a.id.createdAt.toEpochMilli()).toInt() }
            .firstOrNull {
                it.userId != kord.selfId && it.targetId == member.id && it.userId != user.id
            } ?: return@on
    }

    on<MemberUpdateEvent> {
        val guild = this.getGuild()
        val settings = transaction {
            GuildEntity[guild.id.value.toLong()]
        }

        val automod = transaction {
            AutomodEntity[guild.id.value.toLong()]
        }

        // Cannot do anything if we don't have the old member cached
        if (old == null) return@on

        // Check if their nickname was changed
        if (old!!.nickname != null && member.nickname != old!!.nickname) {
            // If the dehoisting automod is disabled, do not do anything
            if (!automod.dehoisting) return@on

            // Run the automod
            val ret = automodContainer.execute(this)
            if (ret) return@on
        }

        // Check if the user is a bot
        val user = member.asUser()
        if (user.isBot) return@on

        // Check if the muted role exists in the db
        if (settings.mutedRoleId == null) return@on

        // Check if the roles were taken away
        val mutedRole = guild.roles.firstOrNull { it.id.value.toLong() == settings.mutedRoleId }
        if (mutedRole == null) {
            // use dsl api instead of dao since it's easier
            // for me, imho.
            transaction {
                Guilds.update({
                    Guilds.id eq guild.id.value.toLong()
                }) {
                    it[mutedRoleId] = null
                }
            }

            return@on
        }

        // unmuted
        if (!member.roles.contains(mutedRole) && old!!.roles.contains(mutedRole)) {
            val self = guild.members.firstOrNull { it.id == kord.selfId } ?: return@on
            val entry = getAuditLogEntriesOf(
                kord,
                self,
                guild.id,
                user.id,
                AuditLogEvent.MemberRoleUpdate
            ) ?: return@on

            // apply here
        }

        // muted
        if (member.roles.contains(mutedRole) && !old!!.roles.contains(mutedRole)) {
            val self = guild.members.firstOrNull { it.id == kord.selfId } ?: return@on
            val entry = getAuditLogEntriesOf(
                kord,
                self,
                guild.id,
                user.id,
                AuditLogEvent.MemberRoleUpdate
            ) ?: return@on

            // apply here
        }
    }
}
