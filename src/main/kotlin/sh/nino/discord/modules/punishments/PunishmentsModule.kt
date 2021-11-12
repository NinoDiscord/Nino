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
import dev.kord.core.Kord
import dev.kord.core.entity.Attachment
import dev.kord.core.entity.Guild
import dev.kord.core.entity.Member
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.VoiceChannel
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.first
import sh.nino.discord.core.database.tables.*
import sh.nino.discord.core.database.transactions.asyncTransaction
import sh.nino.discord.kotlin.logging
import sh.nino.discord.kotlin.pairOf

data class ApplyPunishmentOptions(
    val attachments: List<Attachment> = listOf(),
    val moderator: User,
    val publish: Boolean = true,
    val reason: String? = null,
    val member: MemberLike,
    val soft: Boolean = false,
    val time: Int? = null,
    val days: Int? = null,
    val type: PunishmentType
)

data class ModLogOptions(
    val warningsRemoved: Union<Int, String?>? = null,
    val warningsAdded: Union<Int, String?>? = null,
    val attachments: List<Attachment> = listOf(),
    val moderator: User,
    val voiceChannel: VoiceChannel? = null,
    val reason: String? = null,
    val victim: User,
    val guild: Guild,
    val time: Int? = null,
    val type: PunishmentType
)

interface ApplyActionOptions {
    val reason: String?
    val member: Member
}

data class ApplyGenericMuteOptions(
    override val reason: String? = null,
    override val member: Member,
    val guild: Guild,
    val time: Int? = null,
    val self: Member,
    val moderator: User
): ApplyActionOptions

data class ApplyGenericVoiceAction(
    override val reason: String? = null,
    override val member: Member,
    val guild: Guild,
    val time: Int? = null,
    val self: Member,

    val statement: ModLogOptions,
    val moderator: User
): ApplyActionOptions

class ApplyBanActionOptions(
    override val reason: String? = null,
    override val member: Member,

    val guild: Guild,
    val time: Int? = null,
    val self: Member,
    val moderator: User,
    val soft: Boolean = false,
    val days: Int = 7
): ApplyActionOptions

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

    private suspend fun resolveMember(member: MemberLike): Member {
        if (!member.isPartial) return member.member!!

        return member.guild.members.filter { it.id == member.id }.first()
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
        asyncTransaction {
            GuildCasesEntity.new(member.guild.id.value.toLong()) {
                moderatorId = moderator.id.value.toLong()
                victimId = member.id.value.toLong()
                soft = false
                type = PunishmentType.WARNING_ADDED

                this.reason = "Moderator added **$count** warnings to ${member.tag}${if (reason != null) " ($reason)" else ""}"
            }
        }.execute()

        return if (punishment.isNotEmpty()) Unit else Unit
    }

    /**
     * Removes any warnings from the [member].
     *
     * @param member The member that needs their warnings removed.
     * @param moderator The moderator who invoked this action.
     * @param reason The reason why the warnings were removed.
     * @param amount The amount of warnings to add. If [amount] is set to `null`,
     * it'll just clean their database entries for this specific guild, not globally.
     * @throws IllegalStateException If the member doesn't need any warnings removed.
     */
    suspend fun removeWarnings(member: Member, moderator: Member, reason: String? = null, amount: Int? = null) {
        val warnings = asyncTransaction {
            WarningEntity.find {
                Warnings.id eq member.id.value.toLong()
            }
        }.execute()

        if (warnings.toList().isEmpty()) throw IllegalStateException("Member ${member.tag} doesn't have any warnings to be removed.")
        if (amount == null) {
            logger.info("Removing all warnings from ${member.tag} (invoked from mod - ${moderator.tag}; guild: ${member.guild.asGuild().name})")
            asyncTransaction {
            }.execute()
        }
    }
}

/*
export default class PunishmentService {
  async removeWarning(member: Member, reason?: string, amount?: number | 'all') {
    const count = warnings.reduce((acc, curr) => acc + curr.amount, 0);
    if (amount === 'all') {
      await this.database.warnings.clean(member.guild.id, member.id);
      const model = await this.database.cases.create({
        attachments: [],
        moderatorID: this.discord.client.user.id,
        victimID: member.id,
        guildID: member.guild.id,
        reason,
        type: PunishmentType.WarningRemoved,
      });

      return this.publishToModLog(
        {
          warningsRemoved: 'all',
          moderator: self.user,
          victim: member.user,
          reason,
          guild: member.guild,
          type: PunishmentEntryType.WarningRemoved,
        },
        model
      );
    } else {
      const model = await this.database.cases.create({
        attachments: [],
        moderatorID: this.discord.client.user.id,
        victimID: member.id,
        guildID: member.guild.id,
        reason,
        type: PunishmentType.WarningRemoved,
      });

      await this.database.warnings.create({
        guildID: member.guild.id,
        userID: member.user.id,
        amount: -1,
        reason,
      });

      return this.publishToModLog(
        {
          warningsRemoved: count,
          moderator: self.user,
          victim: member.user,
          reason,
          guild: member.guild,
          type: PunishmentEntryType.WarningRemoved,
        },
        model
      );
    }
  }

  async apply({ attachments, moderator, publish, reason, member, soft, type, days, time }: ApplyPunishmentOptions) {
    this.logger.info(
      `Told to apply punishment ${type} on member ${member.id}${reason ? `, with reason: ${reason}` : ''}${
        publish ? ', publishing to modlog!' : ''
      }`
    );

    const settings = await this.database.guilds.get(member.guild.id);
    const self = member.guild.members.get(this.discord.client.user.id)!;

    if (
      (member instanceof Member && !Permissions.isMemberAbove(self, member)) ||
      (BigInt(self.permissions.allow) & this.permissionsFor(type)) === 0n
    )
      return;

    let user!: Member;
    if (type === PunishmentType.Unban || (type === PunishmentType.Ban && member.guild.members.has(member.id))) {
      user = await this.resolveMember(member, false);
    } else {
      user = await this.resolveMember(member, true);
    }

    const modlogStatement: PublishModLogOptions = {
      attachments: attachments?.map((s) => s.url) ?? [],
      moderator,
      reason,
      victim: user.user,
      guild: member.guild,
      type: stringifyDBType(type)!,
      time,
    };

    switch (type) {
      case PunishmentType.Ban:
        await this.applyBan({
          moderator,
          member: user,
          reason,
          guild: member.guild,
          self,
          days: days ?? 7,
          soft: soft === true,
          time,
        });
        break;

      case PunishmentType.Kick:
        await user.kick(reason ? encodeURIComponent(reason) : 'No reason was specified.');
        break;

      case PunishmentType.Mute:
        await this.applyMute({
          moderator,
          settings,
          member: user,
          reason,
          guild: member.guild,
          self,
          time,
        });

        break;

      case PunishmentType.Unban:
        await member.guild.unbanMember(member.id, reason ? encodeURIComponent(reason) : 'No reason was specified.');
        break;

      case PunishmentType.Unmute:
        await this.applyUnmute({
          moderator,
          settings,
          member: user,
          reason,
          guild: member.guild,
          self,
          time,
        });

        break;

      case PunishmentType.VoiceMute:
        await this.applyVoiceMute({
          moderator,
          statement: modlogStatement,
          member: user,
          reason,
          guild: member.guild,
          self,
          time,
        });

        break;

      case PunishmentType.VoiceDeafen:
        await this.applyVoiceDeafen({
          moderator,
          statement: modlogStatement,
          member: user,
          reason,
          guild: member.guild,
          self,
          time,
        });

        break;

      case PunishmentType.VoiceUnmute:
        await this.applyVoiceUnmute({
          moderator,
          statement: modlogStatement,
          member: user,
          reason,
          guild: member.guild,
          self,
        });

        break;

      case PunishmentType.VoiceUndeafen:
        await this.applyVoiceUndeafen({
          moderator,
          statement: modlogStatement,
          member: user,
          reason,
          guild: member.guild,
          self,
        });

        break;
    }

    const model = await this.database.cases.create({
      attachments: attachments?.slice(0, 5).map((v) => v.url) ?? [],
      moderatorID: moderator.id,
      victimID: member.id,
      guildID: member.guild.id,
      reason,
      soft: soft === true,
      time,
      type,
    });

    if (publish) {
      await this.publishToModLog(modlogStatement, model);
    }
  }

  private async applyBan({ moderator, reason, member, guild, days, soft, time }: ApplyBanActionOptions) {
    await guild.banMember(member.id, days, reason);
    if (soft) await guild.unbanMember(member.id, reason);
    if (!soft && time !== undefined && time > 0) {
      if (this.timeouts.state !== 'connected')
        this.logger.warn('Timeouts service is not connected! Will relay once done...');

      await this.timeouts.apply({
        moderator: moderator.id,
        victim: member.id,
        guild: guild.id,
        type: PunishmentType.Unban,
        time,
      });
    }
  }

  private async applyUnmute({ settings, reason, member, guild }: ApplyGenericMuteOptions) {
    const role = guild.roles.get(settings.mutedRoleID!)!;
    if (member.roles.includes(role.id))
      await member.removeRole(role.id, reason ? encodeURIComponent(reason) : 'No reason was specified.');
  }

  private async applyMute({ moderator, settings, reason, member, guild, time }: ApplyGenericMuteOptions) {
    const roleID = await this.getOrCreateMutedRole(guild, settings);

    if (reason) reason = encodeURIComponent(reason);
    if (!member.roles.includes(roleID)) {
      await member.addRole(roleID, reason ?? 'No reason was specified.');
    }

    if (time !== undefined && time > 0) {
      if (this.timeouts.state !== 'connected')
        this.logger.warn('Timeouts service is not connected! Will relay once done...');

      await this.timeouts.apply({
        moderator: moderator.id,
        victim: member.id,
        guild: guild.id,
        type: PunishmentType.Unmute,
        time,
      });
    }
  }

  private async applyVoiceMute({ moderator, reason, member, guild, statement, time }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState.channelID !== null && !member.voiceState.mute)
      await member.edit({ mute: true }, reason ?? 'No reason was specified.');

    statement.channel = (await this.discord.client.getRESTChannel(member.voiceState.channelID!)) as VoiceChannel;
    if (time !== undefined && time > 0) {
      if (this.timeouts.state !== 'connected')
        this.logger.warn('Timeouts service is not connected! Will relay once done...');

      await this.timeouts.apply({
        moderator: moderator.id,
        victim: member.id,
        guild: guild.id,
        type: PunishmentType.VoiceUnmute,
        time,
      });
    }
  }

  private async applyVoiceDeafen({ moderator, reason, member, guild, statement, time }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState.channelID !== null && !member.voiceState.deaf)
      await member.edit({ deaf: true }, reason ?? 'No reason was specified.');

    statement.channel = (await this.discord.client.getRESTChannel(member.voiceState.channelID!)) as VoiceChannel;
    if (time !== undefined && time > 0) {
      if (this.timeouts.state !== 'connected')
        this.logger.warn('Timeouts service is not connected! Will relay once done...');

      await this.timeouts.apply({
        moderator: moderator.id,
        victim: member.id,
        guild: guild.id,
        type: PunishmentType.VoiceUndeafen,
        time,
      });
    }
  }

  private async applyVoiceUnmute({ reason, member, statement }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState !== undefined && member.voiceState.mute)
      await member.edit({ mute: false }, reason ?? 'No reason was specified.');

    statement.channel = (await this.discord.client.getRESTChannel(member.voiceState.channelID!)) as VoiceChannel;
  }

  private async applyVoiceUndeafen({ reason, member, statement }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState !== undefined && member.voiceState.deaf)
      await member.edit({ deaf: false }, reason ?? 'No reason was specified.');

    statement.channel = (await this.discord.client.getRESTChannel(member.voiceState.channelID!)) as VoiceChannel;
  }

  private async publishToModLog(
    {
      warningsRemoved,
      warningsAdded,
      moderator,
      attachments,
      channel,
      reason,
      victim,
      guild,
      time,
      type,
    }: PublishModLogOptions,
    caseModel: CaseEntity
  ) {
    const settings = await this.database.guilds.get(guild.id);
    if (!settings.modlogChannelID) return;

    const modlog = guild.channels.get(settings.modlogChannelID) as TextChannel;
    if (!modlog) return;

    if (
      !modlog.permissionsOf(this.discord.client.user.id).has('sendMessages') ||
      !modlog.permissionsOf(this.discord.client.user.id).has('embedLinks')
    )
      return;

    const embed = this.getModLogEmbed(caseModel.index, {
      attachments,
      warningsRemoved,
      warningsAdded,
      moderator,
      channel,
      reason,
      victim,
      guild,
      time,
      type: stringifyDBType(caseModel.type)!,
    }).build();
    const content = `**[** ${emojis[type] ?? ':question:'} **~** Case #**${caseModel.index}** (${type}) ]`;
    const message = await modlog.createMessage({
      embed,
      content,
    });

    await this.database.cases.update(guild.id, caseModel.index, {
      messageID: message.id,
    });
  }

  async editModLog(model: CaseEntity, message: Message) {
    const warningRemovedField = message.embeds[0].fields?.find((field) => field.name.includes('Warnings Removed'));
    const warningsAddField = message.embeds[0].fields?.find((field) => field.name.includes('Warnings Added'));

    const obj: Record<string, any> = {};
    if (warningsAddField !== undefined) obj.warningsAdded = Number(warningsAddField.value);

    if (warningRemovedField !== undefined)
      obj.warningsRemoved = warningRemovedField.value === 'All' ? 'All' : Number(warningRemovedField.value);

    return message.edit({
      content: `**[** ${emojis[stringifyDBType(model.type)!] ?? ':question:'} ~ Case #**${model.index}** (${
        stringifyDBType(model.type) ?? '... unknown ...'
      }) **]**`,
      embed: this.getModLogEmbed(model.index, {
        moderator: this.discord.client.users.get(model.moderatorID)!,
        victim: this.discord.client.users.get(model.victimID)!,
        reason: model.reason,
        guild: this.discord.client.guilds.get(model.guildID)!,
        time: model.time !== undefined ? Number(model.time) : undefined,
        type: stringifyDBType(model.type)!,

        ...obj,
      }).build(),
    });
  }

  private async getOrCreateMutedRole(guild: Guild, settings: GuildEntity) {
    let muteRole = settings.mutedRoleID;
    if (muteRole) return muteRole;

    let role = guild.roles.find((x) => x.name.toLowerCase() === 'muted');
    if (!role) {
      role = await guild.createRole(
        {
          mentionable: false,
          permissions: 0,
          hoist: false,
          name: 'Muted',
        },
        `[${this.discord.client.user.username}#${this.discord.client.user.discriminator}] Created "Muted" role`
      );

      muteRole = role.id;

      const topRole = Permissions.getTopRole(guild.members.get(this.discord.client.user.id)!);
      if (topRole !== undefined) {
        await role.editPosition(topRole.position - 1);
        for (const channel of guild.channels.values()) {
          const permissions = channel.permissionsOf(this.discord.client.user.id);
          if (permissions.has('manageChannels'))
            await channel.editPermission(
              /* overwriteID */ role.id,
              /* allowed */ 0,
              /* denied */ Constants.Permissions.sendMessages,
              /* type */ 0,
              /* reason */ `[${this.discord.client.user.username}#${this.discord.client.user.discriminator}] Overrided permissions for new Muted role`
            );
        }
      }
    }

    await this.database.guilds.update(guild.id, { mutedRoleID: role.id });
    return role.id;
  }

  getModLogEmbed(
    caseID: number,
    { warningsRemoved, warningsAdded, attachments, moderator, channel, reason, victim, time }: PublishModLogOptions
  ) {
    const embed = new EmbedBuilder()
      .setColor(0xdaa2c6)
      .setAuthor(
        `${victim.username}#${victim.discriminator} (${victim.id})`,
        undefined,
        victim.dynamicAvatarURL('png', 1024)
      )
      .addField('• Moderator', `${moderator.username}#${moderator.discriminator} (${moderator.id})`, true);

    const _reason =
      reason !== undefined
        ? Array.isArray(reason)
          ? reason.join(' ')
          : reason
        : `
      • No reason was provided. Use \`reason ${caseID} <reason>\` to update it!
    `;

    const _attachments = attachments?.map((url, index) => `• [**\`Attachment #${index}\`**](${url})`).join('\n') ?? '';

    embed.setDescription([_reason, _attachments]);

    if (warningsRemoved !== undefined)
      embed.addField('• Warnings Removed', warningsRemoved === 'all' ? 'All' : warningsRemoved.toString(), true);

    if (warningsAdded !== undefined) embed.addField('• Warnings Added', warningsAdded.toString(), true);

    if (channel !== undefined) embed.addField('• Voice Channel', `${channel.name} (${channel.id})`, true);

    if (time !== undefined || time !== null) {
      try {
        embed.addField('• Time', ms(time!, { long: true }), true);
      } catch {
        // ignore since fuck you
      }
    }

    return embed;
  }
}
 */
