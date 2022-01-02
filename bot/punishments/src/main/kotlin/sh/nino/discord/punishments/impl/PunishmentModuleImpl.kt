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

package sh.nino.discord.punishments.impl

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
import dev.kord.core.entity.*
import dev.kord.core.entity.channel.TextChannel
import dev.kord.core.firstOrNull
import dev.kord.rest.builder.message.EmbedBuilder
import gay.floof.utils.slf4j.logging
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.update
import sh.nino.discord.common.COLOR
import sh.nino.discord.common.extensions.asSnowflake
import sh.nino.discord.common.extensions.inject
import sh.nino.discord.common.ms
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.*
import sh.nino.discord.punishments.MemberLike
import sh.nino.discord.punishments.PunishmentModule
import sh.nino.discord.punishments.builder.ApplyPunishmentBuilder
import sh.nino.discord.punishments.builder.PublishModLogBuilder
import sh.nino.discord.punishments.builder.PublishModLogData
import sh.nino.discord.punishments.sortWith
import sh.nino.discord.timeouts.Client
import sh.nino.discord.timeouts.RequestCommand
import sh.nino.discord.timeouts.Timeout

class PunishmentModuleImpl: PunishmentModule {
    private val logger by logging<PunishmentModuleImpl>()
    private val timeouts: Client by inject()
    private val kord: Kord by inject()

    /**
     * Resolves the current [member] to get the actual member object IF the current
     * [member] object is a partial member instance.
     */
    override suspend fun resolveMember(member: MemberLike, useRest: Boolean): Member {
        if (!member.partial) return member.member!!

        // If it is cached in Kord, let's return it
        val cachedMember = kord.defaultSupplier.getMemberOrNull(member.guild.id, member.id)
        if (cachedMember != null) return cachedMember

        // If not, let's retrieve it from REST
        // the parameter is a bit misleading though...
        return if (useRest) {
            val rawMember = kord.rest.guild.getGuildMember(member.guild.id, member.id)
            Member(rawMember.toData(member.guild.id, member.id), rawMember.user.value!!.toData(), kord)
        } else {
            val user = kord.rest.user.getUser(member.id)
            Member(
                // we're mocking this because we have no information
                // about the member, so.
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
    override suspend fun addWarning(member: Member, moderator: Member, reason: String?, amount: Int, expiresIn: LocalDateTime?) {
        logger.info("Adding $amount warning$${if (amount == 0 || amount > 1) "s" else ""} to ${member.tag} by moderator ${moderator.tag}${if (reason != null) " for $reason" else ""}")
        val warnings = asyncTransaction {
            WarningsEntity.find {
                Warnings.id eq member.id.value.toLong()
            }
        }

        val combined = warnings.fold(0) { acc, curr ->
            acc + curr.amount
        }

        val attach = combined + amount
        if (attach < 0) throw IllegalStateException("attached warnings = out of bounds (<0; gotten $attach)")

        val guildPunishments = asyncTransaction {
            PunishmentsEntity.find {
                Punishments.id eq member.guild.id.value.toLong()
            }
        }

        val punishmentsToExecute = guildPunishments.filter { it.warnings == attach }
        for (punishment in punishmentsToExecute) {
            // TODO
        }

        // add the warning
        val guild = member.guild.asGuild()
        asyncTransaction {
            WarningsEntity.new(member.id.value.toLong()) {
                receivedAt = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())

                this.expiresIn = expiresIn
                this.guildId = guild.id.value.toLong()
                this.amount = amount
                this.reason = reason
            }
        }

        // create a new case
        val case = asyncTransaction {
            GuildCasesEntity.new(member.guild.id.value.toLong()) {
                moderatorId = moderator.id.value.toLong()
                createdAt = LocalDateTime.parse(Clock.System.now().toString())
                victimId = member.id.value.toLong()
                type = PunishmentType.WARNING_ADDED

                this.reason = "Moderator added **$attach** warnings.${if (reason != null) " ($reason)" else ""}"
            }
        }

        return if (guildPunishments.toList().isEmpty()) {
            publishModlog(case) {
                this.moderator = moderator
                this.guild = guild

                warningsAdded = amount
                victim = member
            }
        } else {
            // something here
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
    override suspend fun removeWarning(member: Member, moderator: Member, reason: String?, amount: Int?) {
        logger.info("Removing ${amount ?: "all"} warnings to ${member.tag} by ${moderator.tag}${if (reason != null) " ($reason)" else ""}")
        val warnings = asyncTransaction {
            WarningsEntity.find {
                (Warnings.id eq member.id.value.toLong()) and (Warnings.guildId eq member.guild.id.value.toLong())
            }
        }

        val ifZero = warnings.fold(0) { acc, curr -> acc + curr.amount }
        if (warnings.toList().isEmpty() || (ifZero < 0 || ifZero == 0))
            throw IllegalStateException("Member ${member.tag} doesn't have any warnings to be removed.")

        if (amount == null) {
            asyncTransaction {
                Warnings.deleteWhere {
                    (Warnings.id eq member.id.value.toLong()) and (Warnings.guildId eq member.guild.id.value.toLong())
                }
            }

            // create a new case
            val case = asyncTransaction {
                GuildCasesEntity.new(member.guild.id.value.toLong()) {
                    moderatorId = moderator.id.value.toLong()
                    createdAt = LocalDateTime.parse(Clock.System.now().toString())
                    victimId = member.id.value.toLong()
                    type = PunishmentType.WARNING_ADDED

                    this.reason = "Moderator removed all warnings.${if (reason != null) " ($reason)" else ""}"
                }
            }

            val guild = member.guild.asGuild()
            publishModlog(case) {
                this.moderator = moderator
                this.guild = guild

                warningsRemoved = -1
                victim = member
            }
        } else {
            // Create a warning transaction
            asyncTransaction {
                WarningsEntity.new(member.id.value.toLong()) {
                    this.guildId = member.guild.id.value.toLong()
                    this.amount = -amount
                    this.reason = reason
                }
            }

            val guild = member.guild.asGuild()
            val case = asyncTransaction {
                GuildCasesEntity.new(member.guild.id.value.toLong()) {
                    moderatorId = moderator.id.value.toLong()
                    createdAt = LocalDateTime.parse(Clock.System.now().toString())
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
     * @param member The [member][MemberLike] to execute this action.
     * @param moderator The moderator who executed this action.
     * @param type The punishment type that is being executed.
     * @param builder DSL builder for any extra options.
     */
    override suspend fun apply(
        member: MemberLike,
        moderator: Member,
        type: PunishmentType,
        builder: ApplyPunishmentBuilder.() -> Unit
    ) {
        TODO("Not yet implemented")
    }

    /**
     * Publishes the [case] towards the mod-log channel if specified
     * in guild settings.
     */
    override suspend fun publishModlog(case: GuildCasesEntity, builder: PublishModLogBuilder.() -> Unit) {
        val data = PublishModLogBuilder().apply(builder).build()
        val settings = asyncTransaction {
            GuildSettingsEntity[data.guild.id.value.toLong()]
        }

        val modlogChannel = try {
            data.guild.getChannelOf<TextChannel>(Snowflake(settings.modlogChannelId!!))
        } catch (e: Exception) {
            null
        } ?: return

        val permissions = modlogChannel.getEffectivePermissions(kord.selfId)
        if (!permissions.contains(Permission.SendMessages) || !permissions.contains(Permission.EmbedLinks))
            return

        val message = if (settings.usePlainModlogMessage) {
            modlogChannel.createMessage {
                content = getModlogPlainText(case.id.value.toInt(), data)
            }
        } else {
            modlogChannel.createMessage {
                embeds += getModlogMessage(case.id.value.toInt(), data)
            }
        }

        asyncTransaction {
            GuildCases.update({
                (GuildCases.index eq case.index) and (GuildCases.id eq data.guild.id.value.toLong())
            }) {
                it[messageId] = message.id.value.toLong()
            }
        }
    }

    override suspend fun editModlogMessage(case: GuildCasesEntity, message: Message) {
        // Check if it was with plan text
        val settings = asyncTransaction {
            GuildSettingsEntity[case.id.value]
        }

        val guild = message.getGuild()
        val data = PublishModLogBuilder().apply {
            moderator = guild.members.first { it.id == case.moderatorId.asSnowflake() }
            reason = case.reason
            victim = guild.members.first { it.id == case.victimId.asSnowflake() }
            type = case.type

            this.guild = guild
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
        }

        if (settings.usePlainModlogMessage) {
            // this looks fucking horrendous but it works LOL
            val warningsRegex = "> \\*\\*Warnings (Added|Removed)\\*\\*: ([A-Za-z]|\\d+)".toRegex()
            val matcher = warningsRegex.toPattern().matcher(message.content)

            // if we find any matches, let's grab em all
            if (matcher.matches()) {
                val addOrRemove = matcher.group(1)
                val allOrInt = matcher.group(2)

                when (addOrRemove) {
                    "Added" -> {
                        val intValue = try {
                            Integer.parseInt(allOrInt)
                        } catch (e: Exception) {
                            null
                        } ?: throw IllegalStateException("Unable to cast \"$allOrInt\" into a number.")

                        data.warningsAdded = intValue
                    }

                    "Removed" -> {
                        if (allOrInt == "All") {
                            data.warningsRemoved = -1
                        } else {
                            val intValue = try {
                                Integer.parseInt(allOrInt)
                            } catch (e: Exception) {
                                null
                            } ?: throw IllegalStateException("Unable to cast \"$allOrInt\" into a number.")

                            data.warningsRemoved = intValue
                        }
                    }
                }
            }

            message.edit {
                content = getModlogPlainText(case.id.value.toInt(), data.build())
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
                data.warningsRemoved = Integer.parseInt(warningsRemovedField.value)

            if (warningsAddedField != null)
                data.warningsAdded = Integer.parseInt(warningsAddedField.value)

            message.edit {
                embeds?.plusAssign(getModlogMessage(case.id.value.toInt(), data.build()))
            }
        }
    }

    private suspend fun getOrCreateMutedRole(settings: GuildSettingsEntity, guild: Guild): Snowflake {
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
            GuildSettings.update({ GuildSettings.id eq guild.id.value.toLong() }) {
                it[mutedRoleId] = muteRole
            }
        }

        return Snowflake(muteRole)
    }

    private suspend fun getOrCreateNoThreadsRole(settings: GuildSettingsEntity, guild: Guild): Snowflake {
        if (settings.noThreadsRoleId != null) return Snowflake(settings.noThreadsRoleId!!)

        val muteRole: Long
        val role = guild.roles.firstOrNull {
            it.name.lowercase() == "no threads"
        }

        if (role == null) {
            val newRole = kord.rest.guild.createGuildRole(guild.id) {
                hoist = false
                reason = "Missing no threads role in database and in guild"
                name = "No Threads"
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
                                -Permission.SendMessagesInThreads
                            }

                            reason = "Overrided permissions for role ${newRole.name} (${newRole.id})"
                        }
                    }
                }
            }
        } else {
            muteRole = role.id.value.toLong()
        }

        asyncTransaction {
            GuildSettings.update({ GuildSettings.id eq guild.id.value.toLong() }) {
                it[mutedRoleId] = muteRole
            }
        }

        return Snowflake(muteRole)
    }

    private suspend fun applyBan(
        member: Member,
        reason: String? = null,
        moderator: Member,
        guild: Guild,
        days: Int = 7,
        soft: Boolean = false,
        time: Int? = null
    ) {
        logger.info("Banning ${member.tag} for ${reason ?: "no reason"} by ${moderator.tag} in guild ${guild.name} (${guild.id})")
        guild.ban(member.id) {
            this.deleteMessagesDays = days
            this.reason = reason
        }

        if (soft) {
            logger.info("Unbanning ${member.tag} (executed softban cmd).")
            guild.unban(member.id, reason)
        }

        if (!soft && time != null) {
            if (timeouts.closed) {
                logger.warn("Timeouts microservice has not been established (or not connected)")
                return
            }

            timeouts.send(
                RequestCommand(
                    Timeout(
                        guildId = guild.id.toString(),
                        userId = member.id.toString(),
                        issuedAt = System.currentTimeMillis(),
                        expiresIn = time.toLong(),
                        moderatorId = moderator.id.toString(),
                        reason = reason,
                        type = PunishmentType.UNBAN.key
                    )
                )
            )
        }
    }

    private suspend fun applyUnmute(settings: GuildSettingsEntity, member: Member, reason: String?, guild: Guild) {
        val muteRoleId = getOrCreateMutedRole(settings, guild)
        member.removeRole(muteRoleId, reason)
    }

    private suspend fun applyMute(
        settings: GuildSettingsEntity,
        member: Member,
        moderator: Member,
        reason: String?,
        guild: Guild,
        time: Int?
    ) {
        val roleId = getOrCreateMutedRole(settings, guild)
        member.addRole(roleId, reason)

        if (time != null) {
            if (timeouts.closed) {
                logger.warn("Timeouts microservice has not been established (or not connected)")
                return
            }

            timeouts.send(
                RequestCommand(
                    Timeout(
                        guildId = guild.id.toString(),
                        userId = member.id.toString(),
                        issuedAt = System.currentTimeMillis(),
                        expiresIn = time.toLong(),
                        moderatorId = moderator.id.toString(),
                        reason = reason,
                        type = PunishmentType.UNMUTE.key
                    )
                )
            )
        }
    }

    private suspend fun applyVoiceMute(
        member: Member,
        reason: String?,
        guild: Guild,
        moderator: Member,
        time: Int?
    ) {
        val voiceState = member.getVoiceState()
        if (voiceState.channelId != null && !voiceState.isMuted) {
            member.edit {
                muted = true
                this.reason = reason
            }
        }

        if (time != null) {
            if (timeouts.closed) {
                logger.warn("Timeouts microservice has not been established (or not connected)")
                return
            }

            timeouts.send(
                RequestCommand(
                    Timeout(
                        guildId = guild.id.toString(),
                        userId = member.id.toString(),
                        issuedAt = System.currentTimeMillis(),
                        expiresIn = time.toLong(),
                        moderatorId = moderator.id.toString(),
                        reason = reason,
                        type = PunishmentType.VOICE_UNMUTE.key
                    )
                )
            )
        }
    }

    private suspend fun applyVoiceDeafen(
        moderator: User,
        reason: String?,
        member: Member,
        guild: Guild,
        time: Int? = null
    ) {
        val voiceState = member.getVoiceState()
        if (voiceState.channelId != null && !voiceState.isDeafened) {
            member.edit {
                deafened = true
                this.reason = reason
            }
        }

        if (time != null) {
            if (timeouts.closed) {
                logger.warn("Timeouts microservice has not been established (or not connected)")
                return
            }

            timeouts.send(
                RequestCommand(
                    Timeout(
                        guildId = guild.id.toString(),
                        userId = member.id.toString(),
                        issuedAt = System.currentTimeMillis(),
                        expiresIn = time.toLong(),
                        moderatorId = moderator.id.toString(),
                        reason = reason,
                        type = PunishmentType.VOICE_UNMUTE.key
                    )
                )
            )
        }
    }

    private suspend fun applyVoiceUnmute(
        member: Member,
        reason: String?
    ) {
        val voiceState = member.getVoiceState()
        if (voiceState.channelId != null && !voiceState.isDeafened) {
            member.edit {
                muted = false
                this.reason = reason
            }
        }
    }

    private suspend fun applyVoiceUndeafen(
        member: Member,
        reason: String?
    ) {
        val voiceState = member.getVoiceState()
        if (voiceState.channelId != null && !voiceState.isDeafened) {
            member.edit {
                deafened = false
                this.reason = reason
            }
        }
    }

    private fun getModlogMessage(caseId: Int, data: PublishModLogData): EmbedBuilder = EmbedBuilder().apply {
        color = COLOR
        author {
            name = "[ Case #$caseId | ${data.type.asEmoji} ${data.type.key} ]"
            icon = data.victim.avatar?.url
        }

        description = buildString {
            if (data.reason != null) {
                appendLine("• ${data.reason}")
            } else {
                appendLine("• No reason was specified, edit it using `reason $caseId <reason>`")
            }

            if (data.attachments.isNotEmpty()) {
                appendLine()
                for ((i, attachment) in data.attachments.withIndex()) {
                    appendLine("• [**#$i**](${attachment.url})")
                }
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
                name = "• Time"
                value = verboseTime
                inline = true
            }
        }

        if (data.warningsRemoved != null) {
            field {
                name = "• Warnings Removed"
                inline = true
                value = if (data.warningsRemoved == 1)
                    "All"
                else
                    "${data.warningsRemoved}"
            }
        }

        if (data.warningsAdded != null) {
            field {
                name = "• Warnings Added"
                inline = true
                value = "${data.warningsAdded}"
            }
        }
    }

    private fun getModlogPlainText(caseId: Int, data: PublishModLogData): String = buildString {
        appendLine("**[** Case #**$caseId** | ${data.type.asEmoji} **${data.type.key}** **]**")
        appendLine()
        appendLine("> **Victim**: ${data.victim.tag} (**${data.victim.id}**)")
        appendLine("> **Moderator**: ${data.moderator.tag} (**${data.moderator.id}**)")
        appendLine("> **Reason**: ${data.reason ?: "No reason was specified, edit it using `reason $caseId <reason>`"}")

        if (data.time != null) {
            val verboseTime = ms.fromLong(data.time.toLong())
            appendLine("> :watch: **Time**: $verboseTime")
        }

        if (data.warningsAdded != null) {
            appendLine("> **Warnings Added**: ${data.warningsAdded}")
        }

        if (data.warningsRemoved != null) {
            appendLine("> **Warnings Removed**: ${if (data.warningsRemoved == -1) "All" else data.warningsAdded}")
        }
    }
}
