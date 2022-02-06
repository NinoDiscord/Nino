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

package sh.nino.discord.core.listeners

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
import org.jetbrains.exposed.sql.update
import org.koin.core.context.GlobalContext
import org.slf4j.LoggerFactory
import sh.nino.discord.automod.core.Container
import sh.nino.discord.common.extensions.contains
import sh.nino.discord.common.extensions.createdAt
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.*
import sh.nino.discord.punishments.MemberLike
import sh.nino.discord.punishments.PunishmentModule
import sh.nino.discord.timeouts.Client
import sh.nino.discord.timeouts.RequestCommand
import sh.nino.discord.timeouts.Timeout

private suspend fun getAuditLogEntriesOf(
    kord: Kord,
    self: Member,
    guildId: Snowflake,
    userId: Snowflake,
    action: AuditLogEvent
): DiscordAuditLogEntry? {
    val auditLogs = kord.rest.auditLog.getAuditLogs(
        guildId,
        AuditLogGetRequest(
            userId,
            limit = 3,
            action = action
        )
    )

    return auditLogs.auditLogEntries.sortedWith { a, b ->
        b.id.createdAt.toEpochMilliseconds().toInt() - a.id.createdAt.toEpochMilliseconds().toInt()
    }.firstOrNull()
}

fun Kord.applyGuildMemberEvents() {
    val log = LoggerFactory.getLogger("sh.nino.discord.core.listeners.GuildMemberListenerKt")
    val koin = GlobalContext.get()
    val timeouts = koin.get<Client>()
    val punishments = koin.get<PunishmentModule>()

    on<MemberJoinEvent> {
        val guild = getGuild()
        val user = member.asUser()

        log.info("User ${user.tag} (${user.id}) joined ${guild.name} (${guild.id}) - applying automod!")
        val executed = Container.execute(this)
        if (executed) return@on

        val cases = asyncTransaction {
            GuildCasesEntity.find {
                (GuildCases.id eq guild.id.value.toLong()) and (GuildCases.victimId eq user.id.value.toLong())
            }
        }

        // Check if there were previous cases,
        // if there is none, just skip.
        if (cases.empty()) return@on

        // Check if the last case was a mute, assumed it's a mute evade
        val last = (
            try {
                cases.last()
            } catch (e: Exception) {
                null
            }
            ) ?: return@on

        if (last.type == PunishmentType.MUTE && last.time != null) {
            timeouts.send(
                RequestCommand(
                    Timeout(
                        guildId = "${guild.id}",
                        userId = "${user.id}",
                        issuedAt = System.currentTimeMillis(),
                        expiresIn = System.currentTimeMillis() - last.time!!,
                        moderatorId = last.moderatorId.toString(),
                        reason = last.reason ?: "[Automod] User was mute evading, added role back.",
                        type = PunishmentType.UNBAN.key
                    )
                )
            )
        }
    }

    on<MemberLeaveEvent> {
        val guild = getGuild()
        log.info("User ${user.tag} (${user.id}) has left guild ${guild.name} (${guild.id}) - checking if user was kicked!")

        val member = guild.members.firstOrNull { it.id == kord.selfId } ?: return@on
        val perms = member.getPermissions()

        if (!perms.contains(Permission.ViewAuditLog)) return@on

        // We found an audit log! Let's add it to the mod log!
        val auditLog = getAuditLogEntriesOf(kord, member, guild.id, user.id, AuditLogEvent.MemberKick) ?: return@on
        val moderator = guild.getMember(auditLog.userId)

        punishments.apply(
            MemberLike(user.asMemberOrNull(guild.id), guild, user.id),
            moderator,
            PunishmentType.KICK
        ) {
            reason = auditLog.reason.value ?: "[Automod] User was kicked with no reason."
        }
    }

    on<MemberUpdateEvent> {
        val guild = getGuild()
        val settings = asyncTransaction {
            GuildSettingsEntity.findById(guild.id.value.toLong())!!
        }

        val automodSettings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        // Check if we cannot retrieve the old metadata
        if (old == null) return@on

        // Check if their nickname was changed
        if (old!!.nickname != null && member.nickname != old!!.nickname) {
            // If the automod dehoisting feature is disabled, let's not do anything!
            if (!automodSettings.dehoisting) return@on

            // Run the automod thingy
            val ret = Container.execute(this)
            if (ret) return@on
        }

        // Check if the user is a bot
        val user = member.asUser()
        if (user.isBot) return@on

        // Check if the muted role exists in the database
        if (settings.mutedRoleId == null) return@on

        // Check if the muted role was deleted, so we can act on it
        // to delete it.
        val mutedRole = guild.roles.firstOrNull { it.id.value.toLong() == settings.mutedRoleId }
        if (mutedRole == null) {
            asyncTransaction {
                GuildSettings.update({
                    GuildSettings.id eq guild.id.value.toLong()
                }) {
                    it[mutedRoleId] = null
                }
            }

            return@on
        }

        // Check if they were unmuted
        if (!member.roles.contains(mutedRole) && old!!.roles.contains(mutedRole)) {
            val self = guild.members.firstOrNull { it.id == kord.selfId } ?: return@on
            val entry = getAuditLogEntriesOf(
                kord,
                self,
                guild.id,
                user.id,
                AuditLogEvent.MemberRoleUpdate
            ) ?: return@on

            val moderator = guild.getMember(entry.userId)
            punishments.apply(
                MemberLike(user.asMemberOrNull(guild.id), guild, user.id),
                moderator,
                PunishmentType.UNMUTE
            ) {
                reason = entry.reason.value ?: "[Automod] User was unmuted with no reason."
            }
        }

        if (member.roles.contains(mutedRole) && !old!!.roles.contains(mutedRole)) {
            val self = guild.members.firstOrNull { it.id == kord.selfId } ?: return@on
            val entry = getAuditLogEntriesOf(
                kord,
                self,
                guild.id,
                user.id,
                AuditLogEvent.MemberRoleUpdate
            ) ?: return@on

            val moderator = guild.getMember(entry.userId)
            punishments.apply(
                MemberLike(user.asMemberOrNull(guild.id), guild, user.id),
                moderator,
                PunishmentType.MUTE
            ) {
                reason = entry.reason.value ?: "[Automod] User was muted with no reason."
            }
        }
    }

    log.info("✔ Registered all guild member events!")
}
