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

package sh.nino.discord.punishments.impl

import dev.kord.common.entity.Permission
import dev.kord.common.entity.Permissions
import dev.kord.common.entity.Snowflake
import dev.kord.core.Kord
import dev.kord.core.behavior.channel.editRolePermission
import dev.kord.core.cache.data.MemberData
import dev.kord.core.cache.data.toData
import dev.kord.core.entity.Guild
import dev.kord.core.entity.Member
import dev.kord.core.entity.Message
import dev.kord.core.firstOrNull
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
import org.koin.core.context.GlobalContext
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.*
import sh.nino.discord.punishments.MemberLike
import sh.nino.discord.punishments.PunishmentModule
import sh.nino.discord.punishments.builder.ApplyPunishmentBuilder
import sh.nino.discord.punishments.builder.PublishModLogBuilder
import sh.nino.discord.punishments.sortWith

class PunishmentModuleImpl: PunishmentModule {
    private val logger by logging<PunishmentModuleImpl>()
    private val kord: Kord by lazy {
        GlobalContext.get().get()
    }

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
            // still do nothing LUL
        } else {
            // do nothing LUL
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
     *
     * @param case The case
     */
    override suspend fun publishModlog(case: GuildCasesEntity, builder: PublishModLogBuilder.() -> Unit) {
        TODO("Not yet implemented")
    }

    override suspend fun editModlogMessage(case: GuildCasesEntity, message: Message) {
        TODO("Not yet implemented")
    }

    private suspend fun getOrCreateMutedRole(settings: GuildSettingsEntity, guild: Guild): Snowflake {
        if (settings.mutedRoleId != null) return Snowflake(settings.mutedRoleId!!)

        var muteRole = 0L
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
        // TODO: this
    }
}

/*
    private suspend fun applyBan(
        moderator: User,
        reason: String?,
        member: Member,
        guild: Guild,
        days: Int = 7,
        soft: Boolean = false,
        time: Int? = null
    ) {
        logger.info("Banning ${member.tag} for ${reason ?: "no reason"} :3")
        guild.ban(member.id) {
            this.reason = reason
            this.deleteMessagesDays = days
        }

        if (soft) {
            logger.info("Unbanning ${member.tag} (was softban) for ${reason ?: "no reason"}")
            guild.unban(member.id, reason)
        }

        if (!soft && time != null) {
            // TODO: this
        }
    }

    private suspend fun applyUnmute(
        settings: GuildEntity,
        member: Member,
        reason: String?,
        guild: Guild
    ) {
        val muteRoleId = getOrCreateMutedRole(settings, guild)
        val mutedRole = guild.roles.firstOrNull {
            it.id == muteRoleId
        } ?: return

        if (member.roles.contains(mutedRole))
            member.removeRole(mutedRole.id, reason)
    }

    private suspend fun applyMute(
        settings: GuildEntity,
        moderator: User,
        reason: String?,
        member: Member,
        guild: Guild,
        time: Int? = null
    ) {
        val roleId = getOrCreateMutedRole(settings, guild)
        val mutedRole = guild.roles.first {
            it.id == roleId
        }

        if (!member.roles.contains(mutedRole))
            member.addRole(roleId, reason)

        if (time != null) {
            // TODO: timeouts service
        }
    }

    private suspend fun applyVoiceMute(
        moderator: User,
        reason: String?,
        member: Member,
        guild: Guild,
        time: Int? = null
    ) {
        val voiceState = member.getVoiceState()
        if (voiceState.channelId != null && !voiceState.isMuted) {
            member.edit {
                muted = true
                this.reason = reason
            }
        }

        if (time != null) {
            // TODO: this
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
            // TODO: this
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

    @OptIn(ExperimentalContracts::class)
    suspend fun publishToModlog(case: GuildCasesEntity, builder: PublishModLogBuilder.() -> Unit) {
        contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }

        val data = PublishModLogBuilder().apply(builder).build()
        val settings = transaction { GuildEntity[data.guild.id.value.toLong()] }
        if (settings.modlogChannelId == null) return

        val modlogChannel = try {
            data.guild.getChannelOf<TextChannel>(settings.modlogChannelId!!.asSnowflake())
        } catch (e: Exception) {
            null
        } ?: return

        val permissions = modlogChannel.getEffectivePermissions(kord.selfId)
        if (!permissions.contains(Permission.SendMessages) || !permissions.contains(Permission.EmbedLinks))
            return

        val (type, emoji) = stringifyDbType(data.type)
        val message = modlogChannel.createMessage {
            content = "#${case.index} **|** $emoji $type"
            embeds += getModLogEmbed(case.index, data)
        }

        asyncTransaction {
            GuildCases.update({ (GuildCases.index eq case.index) and (GuildCases.id eq data.guild.id.value.toLong()) }) {
                it[messageId] = message.id.value.toLong()
            }
        }.execute()
    }

    suspend fun editModLog(case: GuildCasesEntity, message: Message) {
        val embed = message.embeds.first()

        val warningsRemovedField = embed.fields.firstOrNull {
            it.name.lowercase().contains("warnings removed")
        }

        val warningsAddedField = embed.fields.firstOrNull {
            it.name.lowercase().contains("warnings added")
        }

        val guild = message.getGuild()
        val cachedUser = kord.defaultSupplier.getUserOrNull(case.victimId.asSnowflake())

        if (case.type == PunishmentType.UNBAN || cachedUser == null) {
            val victimField = embed.fields.firstOrNull {
                it.value.contains(case.victimId.toString())
            } ?: error("Unable to deserialize ID from embed")

            val matcher = Pattern.compile("\\d{15,21}").matcher(victimField.value)
            if (!matcher.matches()) error("Unable to deserialize ID from embed")

            val user = kord.rest.user.getUser(matcher.group(1).asSnowflake()).nullOnError() ?: error("Unknown User")
            val data = PublishModLogBuilder().apply {
                moderator = guild.members.first { it.id == case.moderatorId.asSnowflake() }
                reason = case.reason
                victim = User(user.toData(), kord)
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

                if (warningsAddedField != null) {
                    warningsAdded = Integer.parseInt(warningsAddedField.value)
                }

                if (warningsRemovedField != null) {
                    warningsRemoved = Integer.parseInt(warningsRemovedField.value)
                }

                this.guild = guild
            }

            val (type, emoji) = stringifyDbType(data.type)
            message.edit {
                content = "#${case.index} **|** $emoji $type"
                embeds?.plusAssign(getModLogEmbed(case.index, data.build()))
            }
        } else {
            val data = PublishModLogBuilder().apply {
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

                if (warningsAddedField != null) {
                    warningsAdded = Integer.parseInt(warningsAddedField.value)
                }

                if (warningsRemovedField != null) {
                    warningsRemoved = Integer.parseInt(warningsRemovedField.value)
                }

                this.guild = guild
            }

            val (type, emoji) = stringifyDbType(data.type)
            message.edit {
                content = "#${case.index} **|** $emoji $type"
                embeds?.plusAssign(getModLogEmbed(case.index, data.build()))
            }
        }
    }

    private fun getModLogEmbed(caseId: Int, data: PublishModLogData): EmbedBuilder {
        val embed = EmbedBuilder().apply {
            color = Constants.COLOR
            author {
                name = "${data.victim.tag} (${data.victim.id.asString})"
                icon = data.victim.avatar?.url
            }

            field {
                name = "• Moderator"
                value = "${data.moderator.tag} (**${data.moderator.id.asString}**)"
            }
        }

        val description = buildString {
            if (data.reason != null) {
                appendLine("• ${data.reason}")
            } else {
                appendLine("• **No reason was specified, edit it using `reason $caseId <reason>` to update it.")
            }

            if (data.attachments.isNotEmpty()) {
                appendLine()

                for ((i, attachment) in data.attachments.withIndex()) {
                    appendLine("• [**#$i**](${attachment.url})")
                }
            }
        }

        embed.description = description
        if (data.warningsRemoved != null) {
            embed.field {
                name = "• Warnings Removed"
                value = if (data.warningsRemoved == -1) "All" else data.warningsRemoved.toString()
                inline = true
            }
        }

        if (data.warningsAdded != null) {
            embed.field {
                name = "• Warnings Added"
                value = data.warningsAdded.toString()
                inline = true
            }
        }

        if (data.time != null) {
            val verboseTime = fromLong(data.time.toLong(), true)
            embed.field {
                name = "• :watch: Time"
                value = verboseTime
                inline = true
            }
        }

        return embed
    }
 */
