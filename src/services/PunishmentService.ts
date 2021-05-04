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

import { Constants, Guild, Member, User, VoiceChannel, TextChannel, Message } from 'eris';
import { Inject, Service } from '@augu/lilith';
import { PunishmentType } from '../entities/PunishmentsEntity';
import { EmbedBuilder } from '../structures';
import type GuildEntity from '../entities/GuildEntity';
import type CaseEntity from '../entities/CaseEntity';
import TimeoutsManager from '../components/timeouts/Timeouts';
import Permissions from '../util/Permissions';
import { Logger } from 'tslog';
import Database from '../components/Database';
import Discord from '../components/Discord';
import ms = require('ms');

type MemberLike = Member | { id: string; guild: Guild };

export enum PunishmentEntryType {
  WarningRemoved = 'Warning Removed',
  WarningAdded   = 'Warning Added',
  VoiceUndeafen  = 'Voice Undeafen',
  VoiceUnmute    = 'Voice Unmute',
  VoiceMute      = 'Voice Mute',
  VoiceDeaf      = 'Voice Deafen',
  Unban          = 'Unban',
  Unmuted        = 'Unmuted',
  Muted          = 'Muted',
  Kicked         = 'Kicked',
  Banned         = 'Banned'
}

interface ApplyPunishmentOptions {
  moderator: User;
  publish?: boolean;
  reason?: string;
  member: MemberLike;
  soft?: boolean;
  time?: number;
  days?: number;
  type: PunishmentType;
}

interface PublishModLogOptions {
  warningsRemoved?: number | 'all';
  warningsAdded?: number;
  moderator: User;
  channel?: VoiceChannel;
  reason?: string;
  victim: User;
  guild: Guild;
  time?: number;
  type: PunishmentEntryType;
}

interface ApplyGenericMuteOptions extends ApplyActionOptions {
  moderator: User;
  settings: GuildEntity;
}

interface ApplyActionOptions {
  reason?: string;
  member: Member;
  guild: Guild;
  time?: number;
  self: Member;
}

interface ApplyGenericVoiceAction extends Exclude<ApplyActionOptions, 'guild' | 'time' | 'self'> {
  statement: PublishModLogOptions;
  moderator: User;
}

interface ApplyBanActionOptions extends ApplyActionOptions {
  moderator: User;
  soft: boolean;
  days: number;
}

function stringifyDBType(type: PunishmentType): PunishmentEntryType | null {
  switch (type) {
    case PunishmentType.VoiceUndeafen: return PunishmentEntryType.VoiceUndeafen;
    case PunishmentType.VoiceUnmute: return PunishmentEntryType.VoiceUnmute;
    case PunishmentType.VoiceDeafen: return PunishmentEntryType.VoiceDeaf;
    case PunishmentType.VoiceMute: return PunishmentEntryType.VoiceMute;
    case PunishmentType.Unmute: return PunishmentEntryType.Unmuted;
    case PunishmentType.Unban: return PunishmentEntryType.Unban;
    case PunishmentType.Kick: return PunishmentEntryType.Kicked;
    case PunishmentType.Ban: return PunishmentEntryType.Banned;
    default: return null; // shouldn't come here but oh well
  }
}

const emojis: { [P in PunishmentEntryType]: string } = {
  [PunishmentEntryType.WarningRemoved]: ':pencil:',
  [PunishmentEntryType.VoiceUndeafen]: ':speaking_head:',
  [PunishmentEntryType.WarningAdded]: ':pencil:',
  [PunishmentEntryType.VoiceUnmute]: ':loudspeaker:',
  [PunishmentEntryType.VoiceMute]: ':mute:',
  [PunishmentEntryType.VoiceDeaf]: ':mute:',
  [PunishmentEntryType.Unmuted]: ':loudspeaker:',
  [PunishmentEntryType.Kicked]: ':boot:',
  [PunishmentEntryType.Banned]: ':hammer:',
  [PunishmentEntryType.Unban]: ':bust_in_silhouette:',
  [PunishmentEntryType.Muted]: ':mute:'
};

@Service({
  priority: 1,
  name: 'punishments'
})
export default class PunishmentService {
  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  @Inject
  private logger!: Logger;

  private async resolveMember(member: MemberLike, rest: boolean = true) {
    return member instanceof Member
      ? member
      : member.guild.members.has(member.id)
        ? member.guild.members.get(member.id)!
        : (rest ? await this.discord.client.getRESTGuildMember(member.guild.id, member.id) : new Member({ id: member.id }, member.guild, this.discord.client));
  }

  get timeouts(): TimeoutsManager {
    return app.$ref(TimeoutsManager);
  }

  permissionsFor(type: PunishmentType) {
    switch (type) {
      case PunishmentType.Unmute:
      case PunishmentType.Mute:
        return Constants.Permissions.manageRoles;

      case PunishmentType.VoiceUndeafen:
      case PunishmentType.VoiceDeafen:
        return Constants.Permissions.voiceDeafenMembers;

      case PunishmentType.VoiceUnmute:
      case PunishmentType.VoiceMute:
        return Constants.Permissions.voiceMuteMembers;

      case PunishmentType.Unban:
      case PunishmentType.Ban:
        return Constants.Permissions.banMembers;

      case PunishmentType.Kick:
        return Constants.Permissions.kickMembers;

      default:
        return 0n;
    }
  }

  async createWarning(member: Member, reason?: string, amount?: number) {
    const self = member.guild.members.get(this.discord.client.user.id)!;
    const warnings = await this.database.warnings.getAll(member.guild.id, member.id);
    const current = warnings.reduce((acc, curr) => acc + curr.amount, 0);
    const count = amount !== undefined ? current + amount : current + 1;

    if (count < 0)
      throw new RangeError('amount out of bounds');

    const punishments = await this.database.punishments.getAll(member.guild.id);
    const results = punishments.filter(x => x.warnings === count);

    await this.database.warnings.create({
      guildID: member.guild.id,
      reason,
      amount: amount ?? 1,
      userID: member.id
    });

    // run the actual punishments
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      await this.apply({
        moderator: this.discord.client.users.get(this.discord.client.user.id)!,
        publish: false,
        member,
        type: result.type
      });
    }

    const model = await this.database.cases.create({
      moderatorID: this.discord.client.user.id,
      victimID: member.id,
      guildID: member.guild.id,
      reason,
      soft: false,
      type: PunishmentType.WarningAdded
    });

    return results.length > 0 ? Promise.resolve() : this.publishToModLog({
      warningsAdded: (amount ?? 0) + 1,
      moderator: self.user,
      reason,
      victim: member.user,
      guild: member.guild,
      type: PunishmentEntryType.WarningAdded
    }, model);
  }

  async removeWarning(member: Member, reason?: string, amount?: number | 'all') {
    const self = member.guild.members.get(this.discord.client.user.id)!;
    const warnings = await this.database.warnings.getAll(member.guild.id, member.id);

    if (warnings.length === 0)
      throw new SyntaxError('user doesn\'t have any punishments to be removed');

    const count = warnings.reduce((acc, curr) => acc + curr.amount, 0);
    if (amount === 'all') {
      await this.database.warnings.clean(member.guild.id, member.id);
      const model = await this.database.cases.create({
        moderatorID: this.discord.client.user.id,
        victimID: member.id,
        guildID: member.guild.id,
        reason,
        type: PunishmentType.WarningRemoved
      });

      return this.publishToModLog({
        warningsRemoved: 'all',
        moderator: self.user,
        victim: member.user,
        reason,
        guild: member.guild,
        type: PunishmentEntryType.WarningRemoved
      }, model);
    } else {
      const model = await this.database.cases.create({
        moderatorID: this.discord.client.user.id,
        victimID: member.id,
        guildID: member.guild.id,
        reason,
        type: PunishmentType.WarningRemoved
      });

      return this.publishToModLog({
        warningsRemoved: count,
        moderator: self.user,
        victim: member.user,
        reason,
        guild: member.guild,
        type: PunishmentEntryType.WarningRemoved
      }, model);
    }
  }

  async apply({
    moderator,
    publish,
    reason,
    member,
    soft,
    type,
    days,
    time
  }: ApplyPunishmentOptions) {
    this.logger.info(`Told to apply punishment ${type} on member ${member.id}${reason ? `, with reason: ${reason}` : ''}${publish ? ', publishing to modlog!' : ''}`);

    const settings = await this.database.guilds.get(member.guild.id);
    const self = member.guild.members.get(this.discord.client.user.id)!;

    if (
      (member instanceof Member && !Permissions.isMemberAbove(self, member)) ||
      (BigInt(self.permissions.allow) & this.permissionsFor(type)) === 0n
    ) return;

    let user!: Member;
    if (type === PunishmentType.Unban) {
      user = await this.resolveMember(member, false);
    } else {
      user = await this.resolveMember(member, true);
    }

    const modlogStatement: PublishModLogOptions = {
      moderator,
      reason,
      victim: user.user,
      guild: member.guild,
      type: stringifyDBType(type)!,
      time
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
          time
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
          time
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
          time
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
          time
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
          time
        });

        break;

      case PunishmentType.VoiceUnmute:
        await this.applyVoiceUnmute({
          moderator,
          statement: modlogStatement,
          member: user,
          reason,
          guild: member.guild,
          self
        });

        break;

      case PunishmentType.VoiceUndeafen:
        await this.applyVoiceUndeafen({
          moderator,
          statement: modlogStatement,
          member: user,
          reason,
          guild: member.guild,
          self
        });

        break;
    }

    const model = await this.database.cases.create({
      moderatorID: moderator.id,
      victimID: member.id,
      guildID: member.guild.id,
      reason,
      soft: soft === true,
      time,
      type
    });

    if (publish) {
      await this.publishToModLog(modlogStatement, model);
    }
  }

  private async applyBan({
    moderator,
    reason,
    member,
    guild,
    days,
    soft,
    time
  }: ApplyBanActionOptions) {
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
        time
      });
    }
  }

  private async applyUnmute({
    settings,
    reason,
    member,
    guild
  }: ApplyGenericMuteOptions) {
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
        time
      });
    }
  }

  private async applyVoiceMute({ moderator, reason, member, guild, statement, time }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState !== undefined && !member.voiceState.mute)
      await member.edit({ mute: true }, reason ?? 'No reason was specified.');

    statement.channel = await this.discord.client.getRESTChannel(member.voiceState.channelID!) as VoiceChannel;
    if (time !== undefined && time > 0) {
      if (this.timeouts.state !== 'connected')
        this.logger.warn('Timeouts service is not connected! Will relay once done...');

      await this.timeouts.apply({
        moderator: moderator.id,
        victim: member.id,
        guild: guild.id,
        type: PunishmentType.VoiceUnmute,
        time
      });
    }
  }

  private async applyVoiceDeafen({ moderator, reason, member, guild, statement, time }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState !== undefined && !member.voiceState.deaf)
      await member.edit({ deaf: true }, reason ?? 'No reason was specified.');

    statement.channel = await this.discord.client.getRESTChannel(member.voiceState.channelID!) as VoiceChannel;
    if (time !== undefined && time > 0) {
      if (this.timeouts.state !== 'connected')
        this.logger.warn('Timeouts service is not connected! Will relay once done...');

      await this.timeouts.apply({
        moderator: moderator.id,
        victim: member.id,
        guild: guild.id,
        type: PunishmentType.VoiceUndeafen,
        time
      });
    }
  }

  private async applyVoiceUnmute({ reason, member, statement }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState !== undefined && member.voiceState.mute)
      await member.edit({ mute: false }, reason ?? 'No reason was specified.');

    statement.channel = await this.discord.client.getRESTChannel(member.voiceState.channelID!) as VoiceChannel;
  }

  private async applyVoiceUndeafen({ reason, member, statement }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState !== undefined && member.voiceState.deaf)
      await member.edit({ deaf: false }, reason ?? 'No reason was specified.');

    statement.channel = await this.discord.client.getRESTChannel(member.voiceState.channelID!) as VoiceChannel;
  }

  private async publishToModLog({
    warningsRemoved,
    warningsAdded,
    moderator,
    channel,
    reason,
    victim,
    guild,
    time,
    type
  }: PublishModLogOptions, caseModel: CaseEntity) {
    const settings = await this.database.guilds.get(guild.id);
    if (!settings.modlogChannelID) return;

    const modlog = guild.channels.get(settings.modlogChannelID) as TextChannel;
    if (!modlog)
      return;

    if (
      !modlog.permissionsOf(this.discord.client.user.id).has('sendMessages') ||
      !modlog.permissionsOf(this.discord.client.user.id).has('embedLinks')
    ) return;

    const embed = this.getModLogEmbed(caseModel.index, { warningsRemoved, warningsAdded, moderator, channel, reason, victim, guild, time, type: stringifyDBType(caseModel.type)! }).build();
    const content = `**[** ${emojis[type] ?? ':question:'} **~** Case #**${caseModel.index}** (${type}) ]`;
    const message = await modlog.createMessage({
      embed,
      content
    });

    await this.database.cases.update(guild.id, caseModel.index, { messageID: message.id });
  }

  editModLog(model: CaseEntity, message: Message) {
    return message.edit({
      content: `**[** ${emojis[stringifyDBType(model.type)!] ?? ':question:'} ~ Case #**${model.index}** (${stringifyDBType(model.type) ?? '... unknown ...'}) **]**`,
      embed: this.getModLogEmbed(model.index, {
        moderator: this.discord.client.users.get(model.moderatorID)!,
        victim: this.discord.client.users.get(model.victimID)!,
        reason: model.reason,
        guild: this.discord.client.guilds.get(model.guildID)!,
        time: model.time,
        type: stringifyDBType(model.type)!
      }).build()
    });
  }

  private async getOrCreateMutedRole(guild: Guild, settings: GuildEntity) {
    let muteRole = settings.mutedRoleID;
    if (muteRole)
      return muteRole;

    let role = guild.roles.find(x => x.name.toLowerCase() === 'muted');
    if (!role) {
      role = await guild.createRole({
        mentionable: false,
        permissions: 0,
        hoist: false,
        name: 'Muted'
      }, `[${this.discord.client.user.username}#${this.discord.client.user.discriminator}] Created "Muted" role`);

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
              /* type */ 'role',
              /* reason */ `[${this.discord.client.user.username}#${this.discord.client.user.discriminator}] Overrided permissions for new Muted role`
            );
        }
      }
    }

    await this.database.guilds.update(guild.id, { mutedRoleID: role.id });
    return role.id;
  }

  getModLogEmbed(caseID: number, {
    warningsRemoved,
    warningsAdded,
    moderator,
    channel,
    reason,
    victim,
    time,
    type
  }: PublishModLogOptions) {
    const embed = new EmbedBuilder()
      .setColor(0xDAA2C6)
      .setAuthor(`${victim.username}#${victim.discriminator} (${victim.id})`, undefined, victim.dynamicAvatarURL('png', 1024))
      .addField('• Moderator', `${moderator.username}#${moderator.discriminator} (${moderator.id})`, true);

    embed.setDescription([
      reason !== undefined ? `**${reason}**` : '**No reason was specified**',
      reason === undefined ? `• Use **\`reason ${caseID} <reason>\`** to update the reason` : '',
      time === undefined && [PunishmentEntryType.VoiceDeaf, PunishmentEntryType.VoiceMute, PunishmentEntryType.Muted, PunishmentEntryType.Banned].includes(type)
        ? `• Use **\`ut ${caseID} <time>\`** to update the time of this case.`
        : ''
    ]);

    if (warningsRemoved !== undefined)
      embed.addField(
        '• Warnings Removed',
        warningsRemoved === 'all' ? 'All' : warningsRemoved.toString(),
        true
      );

    if (warningsAdded !== undefined)
      embed.addField('• Warnings Added', warningsAdded.toString(), true);

    if (channel !== undefined)
      embed.addField('• Voice Channel', `${channel.name} (${channel.id})`, true);

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
