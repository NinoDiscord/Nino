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

package sh.nino.modules.punishments

import dev.kord.common.entity.DiscordMessage
import dev.kord.common.entity.Permission
import dev.kord.common.entity.Permissions
import dev.kord.common.entity.Snowflake
import dev.kord.core.Kord
import dev.kord.core.behavior.ban
import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.behavior.channel.editRolePermission
import dev.kord.core.behavior.edit
import dev.kord.core.behavior.getChannelOf
import dev.kord.core.cache.data.AttachmentData
import dev.kord.core.cache.data.MemberData
import dev.kord.core.cache.data.toData
import dev.kord.core.entity.Attachment
import dev.kord.core.entity.Guild
import dev.kord.core.entity.Member
import dev.kord.core.entity.Message
import dev.kord.core.entity.channel.TextChannel
import dev.kord.rest.builder.message.EmbedBuilder
import gay.floof.utils.slf4j.logging
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.update
import sh.nino.commons.Constants
import sh.nino.commons.extensions.asSnowflake
import sh.nino.commons.extensions.inject
import sh.nino.commons.extensions.sortWith
import sh.nino.commons.isMemberAbove
import sh.nino.commons.ms
import sh.nino.database.PunishmentType
import sh.nino.database.asyncTransaction
import sh.nino.database.entities.CaseEntity
import sh.nino.database.entities.GuildEntity
import sh.nino.database.entities.PunishmentEntity
import sh.nino.database.entities.WarningEntity
import sh.nino.database.tables.CasesTable
import sh.nino.database.tables.GuildsTable
import sh.nino.database.tables.PunishmentsTable
import sh.nino.database.tables.WarningsTable
import sh.nino.modules.Registry
import sh.nino.modules.annotations.*
import sh.nino.modules.punishments.builders.ApplyPunishmentBuilder
import sh.nino.modules.punishments.builders.PublishModLogBuilder
import sh.nino.modules.punishments.builders.PublishModLogData
import sh.nino.modules.punishments.extensions.asEmoji
import sh.nino.modules.punishments.extensions.permissions
import sh.nino.modules.punishments.extensions.toKey
import sh.nino.modules.timeouts.TimeoutsModule
import sh.nino.modules.timeouts.on
import sh.nino.modules.timeouts.types.ApplyEvent
import sh.nino.modules.timeouts.types.RequestCommand
import sh.nino.modules.timeouts.types.Timeout
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

private val WEBHOOK_URI_REGEX = "(?:https?:\\/\\/)?(?:canary\\.|ptb\\.)?discord\\.com\\/api\\/webhooks\\/(\\d{15,21})\\/([^\\/]+)".toRegex()

@ModuleMeta(name = "punishments", "Punishments module to implement ")
class PunishmentModule {
    // The queue is where the timeouts get issued if the server is closed.
    private val queue = mutableMapOf<Snowflake, Timeout>()
    private val timeouts: TimeoutsModule by Registry.inject()
    private val kord: Kord by inject()
    private val log by logging<PunishmentModule>()

    @Suppress("UNUSED")
    @Action
    fun onInit() {
        log.info("Initializing events...")

        timeouts.on<ApplyEvent> {
            val timeout = this.timeout
            val issuedAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(timeout.issuedAt), ZoneId.systemDefault())

            log.info("Applying ${timeout.type} to user ${timeout.userId} in guild ${timeout.guildId} (issued_at=$issuedAt)")
        }
    }

    /**
     * Resolves the [member] to get the actual [Member] object out of it, this only calls
     * REST or cache if the member object isn't a partial one.
     */
    suspend fun resolveMember(member: MemberLikeObject, useRest: Boolean = false): Member {
        if (!member.isPartial) {
            return member.member!!
        }

        // Check if it's cached in Kord
        val cached = kord.defaultSupplier.getMemberOrNull(member.guild.id, member.id)
        if (cached != null) return cached

        // Let's retrieve it from REST if we can, though
        // the parameter is kinda mis-leading...
        return if (useRest) {
            val raw = kord.rest.guild.getGuildMember(member.guild.id, member.id)
            Member(raw.toData(member.guild.id, member.id), raw.user.value!!.toData(), kord)
        } else {
            // Get the current user because mocked data!
            val user = kord.rest.user.getUser(member.id)
            Member(
                MemberData(
                    member.id,
                    member.guild.id,
                    joinedAt = Clock.System.now().toString(),
                    roles = listOf()
                ),

                user.toData(),
                kord
            )
        }
    }

    /**
     * Adds a warning to the [member].
     * @param member The member to add warnings towards.
     * @param moderator The moderator who invoked this action.
     * @param reason The reason why the [member] needs to be warned.
     * @param amount The amount of warnings to add. If [amount] is set to `null`,
     * it'll just add the amount of warnings from the [member] in the guild by 1.
     */
    suspend fun addWarning(
        member: Member,
        moderator: Member,
        amount: Int = 1,
        reason: String? = null,
        expiresIn: kotlinx.datetime.LocalDateTime? = null
    ) {
        log.info("Adding $amount warning${if (amount == 0 || amount > 1) "s" else ""} to ${member.tag} (${member.id}) by moderator ${moderator.tag} (${moderator.id})${if (reason != null) ", for $reason" else ""}")

        val warnings = asyncTransaction {
            WarningEntity.find {
                WarningsTable.id eq member.id.value.toLong()
            }
        }

        val combinedAmount = warnings.fold(0) { acc, curr -> acc + curr.amount }
        val attached = combinedAmount + amount

        if (attached < 0)
            throw IllegalStateException("Warnings was not in bounds (<0; got $attached)")

        // Get the guild's punishments
        val punishments = asyncTransaction {
            PunishmentEntity.find {
                PunishmentsTable.id eq member.guild.id.value.toLong()
            }
        }

        val guild = member.guild.asGuild()

        // Execute the punishments that are in range of `attached`
        for (punishment in punishments) {
            apply(
                MemberLikeObject(member, guild, member.id),
                moderator,
                punishment.type
            ) {
                this.time = punishment.time?.toInt()
            }
        }

        // Add the warning
        val guildId = member.guild.id.value.toLong()
        asyncTransaction {
            WarningEntity.new(member.id.value.toLong()) {
                receivedAt = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())

                if (expiresIn != null) {
                    this.expiresIn = expiresIn
                }

                this.reason = reason
                this.amount = amount
                this.guild = guildId
            }
        }

        // Create a new case (if there were no punishments)
        if (punishments.toList().isEmpty()) {
            val case = asyncTransaction {
                CaseEntity.new(member.guild.id.value.toLong()) {
                    moderatorId = moderator.id.value.toLong()
                    createdAt = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())
                    victimId = member.id.value.toLong()
                    type = PunishmentType.WARNING_ADDED

                    this.reason = "Moderator added **$attached** warnings.${if (reason != null) " ($reason)" else ""}"
                }
            }

            publishModlog(case) {
                this.moderator = moderator
                this.guild = guild

                warningsAdded = amount
                victim = member
            }
        }
    }

    /**
     * Removes any warnings from the [member].
     *
     * @param member The member that needs their warnings removed.
     * @param moderator The moderator who invoked this action.
     * @param reason The reason why the warnings were removed.
     * @param amount The amount of warnings to add. If [amount] is set to `null`,
     * it'll just clean their database entries for this specific guild, not globally.
     *
     * @throws IllegalStateException If the member doesn't need any warnings removed.
     */
    suspend fun removeWarning(
        member: Member,
        moderator: Member,
        reason: String? = null,
        amount: Int? = null
    ) {
        log.info("Removing ${amount ?: "all"} warnings to ${member.tag} (${member.id}) by ${moderator.tag} (${moderator.id})${if (reason != null) ", for $reason" else ""}")

        val warnings = asyncTransaction {
            WarningEntity.find {
                (WarningsTable.id eq member.id.value.toLong()) and (WarningsTable.guild eq member.guild.id.value.toLong())
            }
        }

        val ifZero = warnings.fold(0) { acc, curr -> acc + curr.amount }
        if (warnings.toList().isEmpty() || ifZero < 0)
            throw IllegalStateException("Member ${member.tag} doesn't have any warnings to be removed.")

        val guild = member.getGuild()
        if (amount == null) {
            asyncTransaction {
                WarningsTable.deleteWhere {
                    (WarningsTable.id eq member.id.value.toLong()) and (WarningsTable.guild eq member.guild.id.value.toLong())
                }
            }

            val case = asyncTransaction {
                CaseEntity.new(member.guild.id.value.toLong()) {
                    moderatorId = moderator.id.value.toLong()
                    createdAt = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())
                    victimId = member.id.value.toLong()
                    type = PunishmentType.WARNING_ADDED

                    this.reason = "Moderator cleared all warnings.${if (reason != null) " ($reason)" else ""}"
                }
            }

            publishModlog(case) {
                this.moderator = moderator
                this.guild = guild

                warningsRemoved = -1
                victim = member
            }
        } else {
            asyncTransaction {
                WarningEntity.new(member.id.value.toLong()) {
                    this.guild = member.guild.id.value.toLong()
                    this.amount = -amount
                    this.reason = reason
                }
            }

            val case = asyncTransaction {
                CaseEntity.new(member.guild.id.value.toLong()) {
                    moderatorId = moderator.id.value.toLong()
                    createdAt = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())
                    victimId = member.id.value.toLong()
                    type = PunishmentType.WARNING_ADDED

                    this.reason = "Moderator removed **$amount** warnings.${if (reason != null) " ($reason)" else ""}"
                }
            }

            publishModlog(case) {
                this.moderator = moderator
                this.guild = guild

                warningsRemoved = amount
                victim = member
            }
        }
    }

    /**
     * Applies a new punishment to a user, if needed.
     * @param member The [member][MemberLikeObject] to execute this action.
     * @param moderator The moderator who executed this action.
     * @param type The punishment type that is being executed.
     * @param builder DSL builder for any extra options.
     */
    suspend fun apply(
        member: MemberLikeObject,
        moderator: Member,
        type: PunishmentType,
        builder: ApplyPunishmentBuilder.() -> Unit = {}
    ) {
        val options = ApplyPunishmentBuilder().apply(builder).build()
        log.info("Applying punishment ${type.toKey()} to member ${member.id}${if (options.reason != null) ", for ${options.reason}" else ""}")

        val settings = asyncTransaction {
            GuildEntity.findById(member.guild.id.value.toLong())!!
        }

        val self = member.guild.getMember(kord.selfId)
        if (
            (!member.isPartial && isMemberAbove(self, member.member!!)) ||
            (self.getPermissions().code.value.toLong() and type.permissions.code.value.toLong()) == 0L
        ) return

        val mem = resolveMember(member, type != PunishmentType.BAN)
        when (type) {
            PunishmentType.VOICE_UNDEAFEN -> applyVoiceUndeafen(mem, options.reason)
            PunishmentType.VOICE_UNMUTE -> applyVoiceUndeafen(mem, options.reason)
            PunishmentType.VOICE_DEAFEN -> applyVoiceDeafen(mem, moderator, options.reason, options.time)
            PunishmentType.VOICE_MUTE -> applyVoiceMute(mem, moderator, options.reason, options.time)
            PunishmentType.UNMUTE -> applyVoiceUnmute(mem, options.reason)

            PunishmentType.KICK -> {
                mem.guild.kick(member.id, options.reason)
            }

            PunishmentType.UNBAN -> {
                mem.guild.unban(member.id, options.reason)
            }

            PunishmentType.ROLE_ADD -> {
                mem.addRole(options.roleId!!.asSnowflake(), options.reason)
            }

            PunishmentType.ROLE_REMOVE -> {
                mem.removeRole(options.roleId!!.asSnowflake())
            }

            PunishmentType.THREAD_MESSAGES_ADDED -> applyThreadMessagesBack(
                settings,
                mem,
                options.reason
            )

            PunishmentType.THREAD_MESSAGES_REMOVED -> applyRemoveThreadMessagePerms(
                settings,
                mem,
                moderator,
                options.reason,
                options.time
            )

            PunishmentType.BAN -> applyBan(
                mem,
                moderator,
                options.reason,
                options.days,
                options.soft,
                options.time
            )

            PunishmentType.MUTE -> applyMute(
                settings,
                mem,
                moderator,
                options.reason,
                options.time
            )

            else -> {
                // do nothing!
            }
        }

        val case = asyncTransaction {
            CaseEntity.new(member.guild.id.value.toLong()) {
                attachments = options.attachments.toTypedArray().map { it.url }.toTypedArray()
                moderatorId = moderator.id.value.toLong()
                victimId = member.id.value.toLong()
                soft = options.soft
                time = options.time?.toLong()

                this.type = type
                this.reason = options.reason
            }
        }

        if (options.publish) {
            publishModlog(case) {
                this.moderator = moderator

                voiceChannel = options.voiceChannel
                reason = options.reason
                victim = mem
                guild = member.guild
                time = options.time

                if (options.attachments.isNotEmpty()) addAttachments(
                    options.attachments.map {
                        Attachment(
                            // we don't store the id, size, proxyUrl, or filename,
                            // so it's fine to make it mocked.
                            AttachmentData(
                                id = Snowflake(0L),
                                size = 0,
                                url = it.url,
                                proxyUrl = it.proxyUrl,
                                filename = "unknown.png"
                            ),

                            kord
                        )
                    }
                )
            }
        }
    }

    suspend fun publishModlog(case: CaseEntity, builder: PublishModLogBuilder.() -> Unit = {}) {
        val data = PublishModLogBuilder().apply(builder).build()
        val settings = asyncTransaction {
            GuildEntity[data.guild.id.value.toLong()]
        }

        val modlogChannel = try {
            data.guild.getChannelOf<TextChannel>(Snowflake(settings.modlogChannelId!!))
        } catch (e: Exception) {
            null
        } ?: return

        val permissions = modlogChannel.getEffectivePermissions(kord.selfId)
        if (!permissions.contains(Permission.SendMessages) || !permissions.contains(Permission.EmbedLinks))
            return

        val message: Any? = if (settings.usePlainModlogMessage) {
            // Check if we need to execute a webhook
            if (settings.modlogWebhookUri != null) {
                // check if we can match it
                val matcher = WEBHOOK_URI_REGEX.toPattern().matcher(settings.modlogWebhookUri!!)
                val id = Snowflake(matcher.group(1))
                val token = matcher.group(2)

                kord.rest.webhook.executeWebhook(id, token, true) {
                    content = getModlogPlainText(case.id.value.toInt(), data)
                }
            } else {
                modlogChannel.createMessage {
                    content = getModlogPlainText(case.id.value.toInt(), data)
                }
            }
        } else {
            // Check if we need to execute a webhook
            if (settings.modlogWebhookUri != null) {
                // check if we can match it
                val matcher = WEBHOOK_URI_REGEX.toPattern().matcher(settings.modlogWebhookUri!!)
                val id = Snowflake(matcher.group(1))
                val token = matcher.group(2)

                kord.rest.webhook.executeWebhook(id, token, true) {
                    embeds += getModlogMessageAsEmbed(case.id.value.toInt(), data)
                }
            } else {
                modlogChannel.createMessage {
                    embeds += getModlogMessageAsEmbed(case.id.value.toInt(), data)
                }
            }
        }

        val messageID = (message as? DiscordMessage)?.id ?: (message as Message).id

        asyncTransaction {
            CasesTable.update({
                (CasesTable.index eq case.index) and (CasesTable.id eq data.guild.id.value.toLong())
            }) {
                it[messageId] = messageID.value.toLong()
            }
        }
    }

    suspend fun editModlogMessage(case: CaseEntity, message: Message) {
        val settings = asyncTransaction {
            GuildEntity[case.id.value]
        }

        val guild = message.getGuild()
        val data = PublishModLogBuilder().apply {
            this.guild = guild
            moderator = guild.members.first { it.id == case.moderatorId.asSnowflake() }
            reason = case.reason
            victim = guild.members.first { it.id == case.victimId.asSnowflake() }
            type = case.type

            if (case.attachments.isNotEmpty()) {
                addAttachments(
                    case.attachments.map {
                        Attachment(
                            // we don't store the id, size, proxyUrl, or filename,
                            // so it's fine to make it mocked.
                            AttachmentData(
                                id = Snowflake(0L),
                                size = 0,
                                url = it,
                                proxyUrl = it,
                                filename = "unknown.png"
                            ),

                            kord
                        )
                    }
                )
            }

            if (settings.usePlainModlogMessage) {
                // this looks fucking horrendous but it works LOL
                val warningsRegex = "Warnings (Added|Removed): \\*\\*([A-Za-z]*|\\d+)\\*\\*".toRegex()
                val matcher = warningsRegex.toPattern().matcher(message.content)

                // if we find any matches, let's grab em all
                if (matcher.matches()) {
                    val addOrRemove = matcher.group(1)
                    val allOrInt = matcher.group(2)

                    when (addOrRemove) {
                        "Added" -> {
                            // remove instances of `**`
                            val intValue = try {
                                Integer.parseInt(allOrInt.replace("**", ""))
                            } catch (e: Exception) {
                                null
                            } ?: throw IllegalStateException("Unable to cast \"$allOrInt\" into a number.")

                            warningsAdded = intValue
                        }

                        "Removed" -> {
                            if (allOrInt == "**All**") {
                                warningsRemoved = -1
                            } else {
                                val intValue = try {
                                    Integer.parseInt(allOrInt.replace("**", ""))
                                } catch (e: Exception) {
                                    null
                                } ?: throw IllegalStateException("Unable to cast \"$allOrInt\" into a number.")

                                warningsRemoved = intValue
                            }
                        }
                    }
                }
            } else {
                val embed = message.embeds.first()
                val warningsRemovedField = embed.fields.firstOrNull {
                    it.name.lowercase().contains("warnings removed")
                }

                val warningsAddedField = embed.fields.firstOrNull {
                    it.name.lowercase().contains("warnings added")
                }

                if (warningsRemovedField != null)
                    warningsRemoved = Integer.parseInt(warningsRemovedField.value)

                if (warningsAddedField != null)
                    warningsAdded = Integer.parseInt(warningsAddedField.value)
            }
        }

        if (settings.usePlainModlogMessage) {
            if (settings.modlogWebhookUri != null) {
                // check if we can match it
                val matcher = WEBHOOK_URI_REGEX.toPattern().matcher(settings.modlogWebhookUri!!)
                if (!matcher.matches()) return

                val id = Snowflake(matcher.group(1))
                val token = matcher.group(2)

                kord.rest.webhook.editWebhookMessage(id, token, message.id) {
                    content = getModlogPlainText(case.id.value.toInt(), data.build())
                }
            } else {
                message.edit {
                    content = getModlogPlainText(case.id.value.toInt(), data.build())
                }
            }
        } else {
            if (settings.modlogWebhookUri != null) {
                // check if we can match it
                val matcher = WEBHOOK_URI_REGEX.toPattern().matcher(settings.modlogWebhookUri!!)
                if (!matcher.matches()) return

                val id = Snowflake(matcher.group(1))
                val token = matcher.group(2)

                kord.rest.webhook.editWebhookMessage(id, token, message.id) {
                    embeds?.plusAssign(getModlogMessageAsEmbed(case.id.value.toInt(), data.build()))
                }
            } else {
                message.edit {
                    embeds?.plusAssign(getModlogMessageAsEmbed(case.id.value.toInt(), data.build()))
                }
            }
        }
    }

    private suspend fun getOrCreateMutedRole(settings: GuildEntity, guild: Guild): Snowflake {
        if (settings.mutedRoleId != null) return Snowflake(settings.mutedRoleId!!)

        val muteRole: Long
        val role = guild.roles.firstOrNull {
            it.name.lowercase() == "muted"
        }

        if (role == null) {
            val newRole = kord.rest.guild.createGuildRole(guild.id) {
                hoist = false
                reason = "Missing muted role in database and in guild"
                name = "Muted"
                mentionable = false
                permissions = Permissions()
            }

            muteRole = newRole.id.value.toLong()
            val topRole = guild.members.first { it.id == kord.selfId }
                .roles
                .sortWith { a, b -> b.rawPosition - a.rawPosition }
                .firstOrNull()

            if (topRole != null) {
                kord.rest.guild.modifyGuildRolePosition(guild.id) {
                    move(topRole.id to topRole.rawPosition - 1)
                }

                for (channel in guild.channels.toList()) {
                    val perms = channel.getEffectivePermissions(kord.selfId)
                    if (perms.contains(Permission.ManageChannels)) {
                        channel.editRolePermission(newRole.id) {
                            allowed = Permissions()
                            denied = Permissions {
                                -Permission.SendMessages
                            }

                            reason = "Overrided permissions for role ${newRole.name} (${newRole.id})"
                        }
                    }
                }
            }
        } else {
            muteRole = role.id.value.toLong()
        }

        if (muteRole == 0L) throw IllegalStateException("Unable to create or find a mute role, manually add it.")
        asyncTransaction {
            GuildsTable.update({ GuildsTable.id eq guild.id.value.toLong() }) {
                it[mutedRoleId] = muteRole
            }
        }

        return Snowflake(muteRole)
    }

    private suspend fun getOrCreateNoThreadsRole(settings: GuildEntity, guild: Guild): Snowflake {
        if (settings.noThreadsRoleId != null) return Snowflake(settings.noThreadsRoleId!!)

        val muteRole: Long
        val role = guild.roles.firstOrNull {
            it.name.lowercase() == "no threads"
        }

        if (role == null) {
            val newRole = kord.rest.guild.createGuildRole(guild.id) {
                hoist = false
                reason = "Missing \"No Threads\" role in database and in guild"
                name = "Muted"
                mentionable = false
                permissions = Permissions()
            }

            muteRole = newRole.id.value.toLong()
            val topRole = guild.members.first { it.id == kord.selfId }
                .roles
                .sortWith { a, b -> b.rawPosition - a.rawPosition }
                .firstOrNull()

            if (topRole != null) {
                kord.rest.guild.modifyGuildRolePosition(guild.id) {
                    move(topRole.id to topRole.rawPosition - 1)
                }

                for (channel in guild.channels.toList()) {
                    val perms = channel.getEffectivePermissions(kord.selfId)
                    if (perms.contains(Permission.ManageChannels)) {
                        channel.editRolePermission(newRole.id) {
                            allowed = Permissions()
                            denied = Permissions {
                                -Permission.SendMessages
                            }

                            reason = "Overrided permissions for role ${newRole.name} (${newRole.id})"
                        }
                    }
                }
            }
        } else {
            muteRole = role.id.value.toLong()
        }

        if (muteRole == 0L) throw IllegalStateException("Unable to create or find a No Threads role, manually add it.")
        asyncTransaction {
            GuildsTable.update({ GuildsTable.id eq guild.id.value.toLong() }) {
                it[noThreadsRoleId] = muteRole
            }
        }

        return Snowflake(muteRole)
    }

    private suspend fun applyBan(
        member: Member,
        moderator: Member,
        reason: String? = null,
        days: Int = 7,
        soft: Boolean = false,
        time: Int? = null
    ) {
        val guild = member.getGuild()
        log.info("Banning member '${member.tag} (${member.id})' by ${reason ?: "(no reason)"} by moderator '${moderator.tag} (${moderator.id})' in guild ${guild.name} (${guild.id})")

        guild.ban(member.id) {
            this.deleteMessagesDays = days
            this.reason = reason
        }

        if (soft) {
            guild.unban(member.id, reason)
            return
        }

        if (time != null) {
            val timeout = Timeout(
                "${guild.id}",
                "${member.id}",
                System.currentTimeMillis(),
                time.toLong(),
                "${moderator.id}",
                reason,
                PunishmentType.UNBAN.toKey()
            )

            if (timeouts.closed) {
                log.warn("Server is currently closed, adding it to queue...")
                queue[member.id] = timeout
            } else {
                timeouts.send(RequestCommand(timeout))
            }
        }
    }

    private suspend fun applyUnmute(settings: GuildEntity, member: Member, reason: String? = null) {
        val muteRoleId = getOrCreateMutedRole(settings, member.guild.asGuild())
        member.removeRole(muteRoleId, reason)
    }

    private suspend fun applyThreadMessagesBack(settings: GuildEntity, member: Member, reason: String? = null) {
        val threadRoleId = getOrCreateNoThreadsRole(settings, member.guild.asGuild())
        member.removeRole(threadRoleId, reason)
    }

    private suspend fun applyMute(
        settings: GuildEntity,
        member: Member,
        moderator: Member,
        reason: String? = null,
        time: Int?
    ) {
        val guild = member.getGuild()
        val roleId = getOrCreateMutedRole(settings, guild)
        member.addRole(roleId, reason)

        if (time != null) {
            val timeout = Timeout(
                "${guild.id}",
                "${member.id}",
                System.currentTimeMillis(),
                time.toLong(),
                "${moderator.id}",
                reason,
                PunishmentType.UNMUTE.toKey()
            )

            if (timeouts.closed) {
                log.warn("Server is currently closed, adding it to queue...")
                queue[member.id] = timeout
            } else {
                timeouts.send(RequestCommand(timeout))
            }
        }
    }

    private suspend fun applyRemoveThreadMessagePerms(
        settings: GuildEntity,
        member: Member,
        moderator: Member,
        reason: String? = null,
        time: Int?
    ) {
        val guild = member.getGuild()
        val roleId = getOrCreateNoThreadsRole(settings, guild)
        member.addRole(roleId, reason)

        if (time != null) {
            val timeout = Timeout(
                "${guild.id}",
                "${member.id}",
                System.currentTimeMillis(),
                time.toLong(),
                "${moderator.id}",
                reason,
                PunishmentType.THREAD_MESSAGES_ADDED.toKey()
            )

            if (timeouts.closed) {
                log.warn("Server is currently closed, adding it to queue...")
                queue[member.id] = timeout
            } else {
                timeouts.send(RequestCommand(timeout))
            }
        }
    }

    private suspend fun applyVoiceMute(
        member: Member,
        moderator: Member,
        reason: String? = null,
        time: Int?
    ) {
        val guild = member.getGuild()
        val voiceState = member.getVoiceState()
        if (voiceState.channelId != null && !voiceState.isMuted) {
            member.edit {
                this.reason = reason
                muted = true
            }
        }

        if (time != null) {
            val timeout = Timeout(
                "${guild.id}",
                "${member.id}",
                System.currentTimeMillis(),
                time.toLong(),
                "${moderator.id}",
                reason,
                PunishmentType.VOICE_UNMUTE.toKey()
            )

            if (timeouts.closed) {
                log.warn("Server is currently closed, adding it to queue...")
                queue[member.id] = timeout
            } else {
                timeouts.send(RequestCommand(timeout))
            }
        }
    }

    private suspend fun applyVoiceDeafen(
        member: Member,
        moderator: Member,
        reason: String? = null,
        time: Int?
    ) {
        val guild = member.getGuild()
        val voiceState = member.getVoiceState()
        if (voiceState.channelId != null && !voiceState.isDeafened) {
            member.edit {
                this.reason = reason
                muted = true
            }
        }

        if (time != null) {
            val timeout = Timeout(
                "${guild.id}",
                "${member.id}",
                System.currentTimeMillis(),
                time.toLong(),
                "${moderator.id}",
                reason,
                PunishmentType.VOICE_UNDEAFEN.toKey()
            )

            if (timeouts.closed) {
                log.warn("Server is currently closed, adding it to queue...")
                queue[member.id] = timeout
            } else {
                timeouts.send(RequestCommand(timeout))
            }
        }
    }

    private suspend fun applyVoiceUnmute(member: Member, reason: String? = null) {
        val voiceState = member.getVoiceState()
        if (voiceState.channelId != null && !voiceState.isDeafened) {
            member.edit {
                muted = false
                this.reason = reason
            }
        }
    }

    private suspend fun applyVoiceUndeafen(member: Member, reason: String? = null) {
        val voiceState = member.getVoiceState()
        if (voiceState.channelId != null && !voiceState.isDeafened) {
            member.edit {
                deafened = false
                this.reason = reason
            }
        }
    }

    private fun getModlogMessageAsEmbed(caseId: Int, data: PublishModLogData): EmbedBuilder = EmbedBuilder().apply {
        color = Constants.COLOR
        author {
            name = "[ ${data.type.asEmoji} ${data.type.name} | Case #$caseId ]"
            icon = data.victim.avatar?.url
        }

        description = buildString {
            if (data.reason != null) {
                appendLine(data.reason)
            }

            if (data.attachments.isNotEmpty()) {
                if (data.reason != null) appendLine()

                for ((index, attachment) in data.attachments.withIndex())
                    appendLine("• [**Attachment #$index**](${attachment.url})")
            }
        }

        field {
            name = "• Victim"
            value = "${data.victim.tag} (**${data.victim.id}**)"
        }

        field {
            name = "• Moderator"
            value = "${data.moderator.tag} (**${data.moderator.id}**)"
        }

        if (data.time != null) {
            val verboseTime = ms.fromLong(data.time.toLong(), true)
            field {
                name = "• ${data.type.toKey()} Expires In"
                value = "$verboseTime <t:${(System.currentTimeMillis() - data.time) / 1000}:R>"
            }
        }

        if (data.warningsAdded != null) {
            field {
                name = "• Warnings Added"
                inline = true
                value = if (data.warningsAdded == 1) "All" else data.warningsAdded.toString()
            }
        }

        if (data.warningsRemoved != null) {
            field {
                name = "• Warnings Removed"
                inline = true
                value = if (data.warningsRemoved == 1) "All" else data.warningsRemoved.toString()
            }
        }
    }

    private fun getModlogPlainText(caseId: Int, data: PublishModLogData): String = buildString {
        appendLine("[ ${data.type.asEmoji} ${data.type.toKey()} | Case #**$caseId** ]")

        if (data.reason != null) {
            appendLine(data.reason)
            appendLine()
        }

        if (data.attachments.isNotEmpty()) {
            for ((index, attachment) in data.attachments.withIndex())
                appendLine("• [**Attachment #$index**](${attachment.url})")
        }

        appendLine("• Victim: **${data.victim.tag}** (${data.victim.id})")
        appendLine("• Moderator: **${data.moderator.tag}** (${data.moderator.id})")

        if (data.time != null) {
            val verboseTime = ms.fromLong(data.time.toLong(), true)
            appendLine("• ${data.type.toKey()} Expires In: **$verboseTime** <t:${(System.currentTimeMillis() - data.time) / 1000}:R>")
        }

        if (data.warningsAdded != null) {
            appendLine("• **Warnings Added**: ${data.warningsAdded}")
        }

        if (data.warningsRemoved != null) {
            appendLine("• **Warnings Removed**: ${if (data.warningsRemoved == -1) "All" else data.warningsAdded}")
        }
    }
}
