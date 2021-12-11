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

package sh.nino.discord.modules.punishments

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
import dev.kord.rest.builder.message.EmbedBuilder
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDateTime
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import sh.nino.discord.core.database.tables.*
import sh.nino.discord.core.database.transactions.asyncTransaction
import sh.nino.discord.extensions.asSnowflake
import sh.nino.discord.extensions.contains
import sh.nino.discord.extensions.nullOnError
import sh.nino.discord.kotlin.logging
import sh.nino.discord.kotlin.pairOf
import sh.nino.discord.modules.punishments.builders.ApplyPunishmentBuilder
import sh.nino.discord.modules.punishments.builders.PublishModLogBuilder
import sh.nino.discord.modules.punishments.builders.PublishModLogData
import sh.nino.discord.utils.Constants
import sh.nino.discord.utils.fromLong
import sh.nino.discord.utils.getTopRole
import sh.nino.discord.utils.isMemberAbove
import java.util.regex.Pattern
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

private fun stringifyDbType(type: PunishmentType): Pair<String, String> = when (type) {
    PunishmentType.BAN -> pairOf("Banned", "\uD83D\uDD28")
    PunishmentType.KICK -> pairOf("Kicked", "\uD83D\uDC62")
    PunishmentType.MUTE -> pairOf("Muted", "\uD83D\uDD07")
    PunishmentType.UNBAN -> pairOf("Unbanned", "\uD83D\uDC64")
    PunishmentType.UNMUTE -> pairOf("Unmuted", "\uD83D\uDCE2")
    PunishmentType.VOICE_MUTE -> pairOf("Voice Muted", "\uD83D\uDD07")
    PunishmentType.VOICE_UNMUTE -> pairOf("Voice Unmuted", "\uD83D\uDCE2")
    PunishmentType.VOICE_DEAFEN -> pairOf("Voice Deafened", "\uD83D\uDD07")
    PunishmentType.VOICE_UNDEAFEN -> pairOf("Voice Undeafened", "\uD83D\uDCE2")
    PunishmentType.THREAD_MESSAGES_ADDED -> pairOf("Thread Messaging Permissions Added", "\uD83E\uDDF5")
    PunishmentType.THREAD_MESSAGES_REMOVED -> pairOf("Thread Messaging Permissions Removed", "\uD83E\uDDF5")
    else -> error("Unknown punishment type: $type")
}

class PunishmentsModule(private val kord: Kord) {
    private val logger by logging<PunishmentsModule>()

    private suspend fun resolveMember(member: MemberLike, rest: Boolean = true): Member {
        if (!member.isPartial) return member.member!!

        // If it is cached, return it
        val user = kord.defaultSupplier.getUserOrNull(member.id)
        if (user != null) {
            return user.asMember(member.guild.id)
        }

        return if (rest) {
            val guildMember = kord.rest.guild.getGuildMember(member.guild.id, member.id).toData(member.id, member.guild.id)
            val u = kord.rest.user.getUser(member.id).toData()

            Member(
                guildMember,
                u,
                kord
            )
        } else {
            val u = kord.rest.user.getUser(member.id).toData()

            // For now, let's mock the member data
            // with the user values. :3
            Member(
                MemberData(
                    member.id,
                    member.guild.id,
                    joinedAt = Clock.System.now().toString(),
                    roles = listOf()
                ),
                u,
                kord
            )
        }
    }

    private fun permissionsForType(type: PunishmentType): Permissions = when (type) {
        PunishmentType.MUTE, PunishmentType.UNMUTE -> Permissions {
            +Permission.ManageRoles
        }

        PunishmentType.VOICE_UNDEAFEN, PunishmentType.VOICE_DEAFEN -> Permissions {
            +Permission.DeafenMembers
        }

        PunishmentType.VOICE_MUTE, PunishmentType.VOICE_UNMUTE -> Permissions {
            +Permission.MuteMembers
        }

        PunishmentType.UNBAN, PunishmentType.BAN -> Permissions {
            +Permission.BanMembers
        }

        PunishmentType.KICK -> Permissions {
            +Permission.KickMembers
        }

        else -> Permissions()
    }

    /**
     * Adds a warning to the [member].
     * @param member The member to add warnings towards.
     * @param moderator The moderator who invoked this action.
     * @param reason The reason why the [member] needs to be warned.
     * @param amount The amount of warnings to add. If [amount] is set to `null`,
     * it'll just add the amount of warnings from the [member] in the guild by 1.
     */
    suspend fun addWarning(member: Member, moderator: Member, reason: String? = null, amount: Int? = null) {
        val warnings = asyncTransaction {
            WarningEntity.find {
                Warnings.id eq member.id.value.toLong()
            }
        }.execute()

        val all = warnings.fold(0) { acc, curr ->
            acc + curr.amount
        }

        val count = if (amount != null) all + amount else all + 1
        if (count < 0) throw IllegalStateException("amount out of bounds (< 0; gotten $count)")

        val punishments = asyncTransaction {
            PunishmentsEntity.find {
                Punishments.id eq member.guild.id.value.toLong()
            }
        }.execute()

        val punishment = punishments.filter { it.warnings == count }

        // Create a new entry
        asyncTransaction {
            WarningEntity.new(member.id.value.toLong()) {
                this.guildId = member.guild.id.value.toLong()
                this.amount = count
                this.reason = reason
            }
        }.execute()

        // run punishments
        for (p in punishment) {
            // TODO: this
        }

        // new case!
        val case = asyncTransaction {
            GuildCasesEntity.new(member.guild.id.value.toLong()) {
                moderatorId = moderator.id.value.toLong()
                createdAt = LocalDateTime.parse(Clock.System.now().toString())
                victimId = member.id.value.toLong()
                soft = false
                type = PunishmentType.WARNING_ADDED

                this.reason = "Moderator added **$count** warnings to ${member.tag}${if (reason != null) " ($reason)" else ""}"
            }
        }.execute()

        val guild = member.guild.asGuild()
        return if (punishment.isNotEmpty()) {
            publishToModlog(case) {
                this.moderator = moderator
                this.guild = guild

                warningsRemoved = count
                victim = member
            }
        } else {
            // do nothing lmao
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
    suspend fun removeWarnings(member: Member, moderator: Member, reason: String? = null, amount: Int? = null) {
        val warnings = asyncTransaction {
            WarningEntity.find {
                (Warnings.id eq member.id.value.toLong()) and (Warnings.guildId eq member.guildId.value.toLong())
            }
        }.execute()

        if (warnings.toList().isEmpty()) throw IllegalStateException("Member ${member.tag} doesn't have any warnings to be removed.")
        if (amount == null) {
            logger.info("Removing all warnings from ${member.tag} (invoked from mod - ${moderator.tag}; guild: ${member.guild.asGuild().name})")

            // Delete all warnings
            asyncTransaction {
                Warnings.deleteWhere {
                    (Warnings.id eq member.id.value.toLong()) and (Warnings.guildId eq member.guildId.value.toLong())
                }
            }.execute()

            // Create a new case
            val case = asyncTransaction {
                GuildCasesEntity.new(member.guildId.value.toLong()) {
                    moderatorId = moderator.id.value.toLong()
                    createdAt = LocalDateTime.parse(Clock.System.now().toString())
                    victimId = member.id.value.toLong()
                    soft = false
                    type = PunishmentType.WARNING_REMOVED

                    this.reason = "Moderator cleaned all warnings.${if (reason != null) " ($reason)" else ""}"
                }
            }.execute()

            val guild = member.guild.asGuild()
            publishToModlog(case) {
                this.moderator = moderator
                this.guild = guild

                warningsRemoved = -1
                victim = member
            }
        } else {
            // Create a new case
            val case = asyncTransaction {
                GuildCasesEntity.new(member.guildId.value.toLong()) {
                    moderatorId = moderator.id.value.toLong()
                    createdAt = LocalDateTime.parse(Clock.System.now().toString())
                    victimId = member.id.value.toLong()
                    soft = false
                    type = PunishmentType.WARNING_REMOVED

                    this.reason = "Moderator cleaned **$amount** warnings.${if (reason != null) " ($reason)" else ""}"
                }
            }.execute()

            asyncTransaction {
                WarningEntity.new(member.id.value.toLong()) {
                    this.guildId = member.guild.id.value.toLong()
                    this.amount = -1
                    this.reason = reason
                }
            }.execute()

            val guild = member.guild.asGuild()
            publishToModlog(case) {
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
    @OptIn(ExperimentalContracts::class)
    suspend fun apply(
        member: MemberLike,
        moderator: Member,
        type: PunishmentType,
        builder: ApplyPunishmentBuilder.() -> Unit = {}
    ) {
        contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }

        val options = ApplyPunishmentBuilder().apply(builder).build()
        logger.info("Applying punishment ${type.key} on member ${member.id.asString}${if (options.reason != null) ", with reason: ${options.reason}" else ""}")

        // TODO: port all db executions to a "controller"
        val settings = asyncTransaction {
            GuildEntity.findById(member.guild.id.value.toLong())!!
        }.execute()

        val self = member.guild.members.first { it.id.value == kord.selfId.value }
        if (
            (!member.isPartial && isMemberAbove(self, member.member!!)) ||
            (self.getPermissions().code.value.toLong() and permissionsForType(type).code.value.toLong() == 0L)
        ) return

        val actual = resolveMember(member, type != PunishmentType.UNBAN)
        when (type) {
            PunishmentType.BAN -> {
                applyBan(
                    moderator,
                    options.reason,
                    actual,
                    member.guild,
                    options.days ?: 7,
                    options.soft,
                    options.time
                )
            }

            PunishmentType.KICK -> {
                actual.kick(options.reason)
            }

            PunishmentType.MUTE -> {
                applyMute(
                    settings,
                    moderator,
                    options.reason,
                    actual,
                    member.guild,
                    options.time
                )
            }

            PunishmentType.UNBAN -> {
                actual.guild.unban(member.id, options.reason)
            }

            PunishmentType.UNMUTE -> {
                applyUnmute(
                    settings,
                    actual,
                    options.reason,
                    member.guild
                )
            }

            PunishmentType.VOICE_MUTE -> {
                applyVoiceMute(
                    moderator,
                    options.reason,
                    actual,
                    member.guild,
                    options.time
                )
            }

            PunishmentType.VOICE_UNMUTE -> {
                applyVoiceUnmute(actual, options.reason)
            }

            PunishmentType.VOICE_UNDEAFEN -> {
                applyVoiceUndeafen(actual, options.reason)
            }

            PunishmentType.VOICE_DEAFEN -> {
                applyVoiceDeafen(
                    moderator,
                    options.reason,
                    actual,
                    member.guild,
                    options.time
                )
            }

            PunishmentType.THREAD_MESSAGES_ADDED -> {
                // TODO
            }

            PunishmentType.THREAD_MESSAGES_REMOVED -> {
                // TODO
            }

            // Don't run anything.
            else -> {}
        }

        val case = asyncTransaction {
            GuildCasesEntity.new(member.guild.id.value.toLong()) {
                attachments = options.attachments.toTypedArray()
                moderatorId = moderator.id.value.toLong()
                victimId = member.id.value.toLong()
                soft = options.soft
                time = options.time?.toLong()

                this.type = type
                this.reason = options.reason
            }
        }.execute()

        if (options.shouldPublish) {
            publishToModlog(case) {
                this.moderator = moderator

                voiceChannel = options.voiceChannel
                reason = options.reason
                victim = actual
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
    }

    private suspend fun getOrCreateMutedRole(settings: GuildEntity, guild: Guild): Snowflake {
        if (settings.mutedRoleId != null) return settings.mutedRoleId!!.asSnowflake()

        var muteRole = 0L
        val role = guild.roles.firstOrNull {
            it.name.lowercase() == "muted"
        }

        if (role == null) {
            val newRole = kord.rest.guild.createGuildRole(guild.id) {
                hoist = false
                reason = "Missing Muted role."
                name = "Muted"
                mentionable = false
                permissions = Permissions()
            }

            muteRole = newRole.id.value.toLong()
            val topRole = getTopRole(guild.members.first { it.id == kord.selfId })
            if (topRole != null) {
                kord.rest.guild.modifyGuildRolePosition(guild.id) {
                    move(topRole.id to topRole.rawPosition - 1)
                }

                for (channel in guild.channels.toList()) {
                    val permissions = channel.getEffectivePermissions(kord.selfId)
                    if (permissions.contains(Permission.ManageChannels)) {
                        channel.editRolePermission(newRole.id) {
                            allowed = Permissions()
                            denied = Permissions {
                                -Permission.SendMessages
                            }

                            reason = "Overridden permissions for role ${newRole.name}"
                        }
                    }
                }
            }
        } else {
            // If it does exist, let's just assume that Nino
            // can use it.
            muteRole = role.id.value.toLong()
        }

        if (muteRole == 0L) throw IllegalStateException("cannot set mute role to `0L`")
        asyncTransaction {
            Guilds.update({ Guilds.id eq guild.id.value.toLong() }) {
                it[mutedRoleId] = muteRole
            }
        }.execute()

        return muteRole.asSnowflake()
    }

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
}
