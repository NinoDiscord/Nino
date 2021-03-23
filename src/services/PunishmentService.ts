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

import { Constants, Guild, Member, User, VoiceChannel } from 'eris';
import { Inject, Service } from '@augu/lilith';
import { PunishmentType } from '../entities/PunishmentsEntity';
import type GuildEntity from '../entities/GuildEntity';
import Permissions from '../util/Permissions';
import { Logger } from 'tslog';
import Database from '../components/Database';
import Discord from '../components/Discord';
import ms = require('ms');


type MemberLike = Member | { id: string; guild: Guild };

enum PunishmentEntryType {
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
  channelID?: string;
  moderator: Member;
  publish?: boolean;
  reason?: string;
  member: MemberLike;
  time?: number;
  type: PunishmentType;
}

interface PublishModLogOptions {
  warningsRemoved?: number | 'all';
  warningsAdded?: number;
  moderator: User;
  channel?: VoiceChannel;
  reason?: string;
  victim: User;
  time?: number;
  type: PunishmentEntryType;
}

interface ApplyUnmuteOptions extends ApplyActionOptions {
  settings: GuildEntity;
}

interface ApplyActionOptions {
  reason?: string;
  member: Member;
  guild: Guild;
  self: Member;
}

interface ApplyGenericVoiceAction extends ApplyActionOptions {
  statement: PublishModLogOptions;
  channelID: string;
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

export default class PunishmentService implements Service {
  public name: string = 'punishments';

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  @Inject
  private logger!: Logger;

  private async resolveMember(member: MemberLike) {
    return member instanceof Member
      ? member
      : member.guild.members.has(member.id)
        ? member.guild.members.get(member.id)!
        : (await this.discord.client.getRESTGuildMember(member.guild.id, member.id));
  }

  permissionsFor(type: PunishmentType): number {
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
        return 0;
    }
  }

  async createWarning(member: Member, reason?: string, amount?: number) {
    const self = member.guild.members.get(this.discord.client.user.id)!;
    const warnings = await this.database.warnings.get(member.guild.id, member.id);
    const count = warnings
      ? (amount !== undefined ? warnings.amount + amount : warnings.amount + 1)
      : (amount !== undefined ? amount : 1);

    if (count < 0)
      throw new RangeError('amount out of bounds');

    const punishments = await this.database.punishments.getAll(member.guild.id);
    const results = punishments.filter(x => x.warnings === count);

    await this.database.warnings.create({
      guildID: member.guild.id,
      reason,
      amount: count,
      userID: member.id
    });

    const items = results.map<PublishModLogOptions>(result => ({
      warningsAdded: result.warnings, // i think?
      moderator: self.user,
      victim: member.user,
      type: stringifyDBType(result.type)!
    }));

    // run the actual punishments
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      await this.apply({
        moderator: self,
        publish: false,
        member,
        type: result.type
      });
    }

    return results.length ? this.bulkPublish(items) : this.publishToModLog({
      warningsAdded: count,
      moderator: self.user,
      victim: member.user,
      type: PunishmentEntryType.WarningAdded
    });
  }

  async removeWarning(member: Member, reason?: string, amount?: number | 'all') {
    const self = member.guild.members.get(this.discord.client.user.id)!;
    const warnings = await this.database.warnings.get(member.guild.id, member.id);
    if (warnings === undefined)
      throw new SyntaxError('user doesn\'t have any punishments to be removed');

    if (amount === 'all') {
      await this.database.warnings.clean(member.guild.id, member.id);
      return this.publishToModLog({
        warningsRemoved: 'all',
        moderator: self.user,
        victim: member.user,
        reason,
        type: PunishmentEntryType.WarningRemoved
      });
    } else {
      const count = amount !== undefined ? (warnings.amount - amount) : (warnings.amount - 1);
      return this.publishToModLog({
        warningsRemoved: count,
        moderator: self.user,
        victim: member.user,
        reason,
        type: PunishmentEntryType.WarningRemoved
      });
    }
  }

  async apply({
    channelID,
    moderator,
    publish,
    reason,
    member,
    type
  }: ApplyPunishmentOptions) {
    this.logger.info(`Told to apply punishment ${type} on member ${member.id}${reason ? `, with reason: ${reason}` : ''}${publish ? ', publishing to modlog!' : ''}`);

    const settings = await this.database.guilds.get(member.guild.id);
    const self = member.guild.members.get(this.discord.client.user.id)!;

    if (
      (member instanceof Member && !Permissions.isMemberAbove(self, member)) ||
      (self.permissions.allow & this.permissionsFor(type)) === 0
    ) return;

    const user = await this.resolveMember(member);
    const modlogStatement: PublishModLogOptions = {
      moderator: moderator.user,
      victim: user.user,
      type: stringifyDBType(type)!
    };

    switch (type) {
      case PunishmentType.Ban:
        await this.applyBan(user, member.guild, `[${moderator.username}#${moderator.discriminator} | Ban] ${reason ? encodeURIComponent(reason) : 'No reason was specified.'}`);
        break;

      case PunishmentType.Kick:
        await user.kick(`[${moderator.username}#${moderator.discriminator} | Kick] ${reason ? encodeURIComponent(reason) : 'No reason was specified.'}`);
        break;

      case PunishmentType.Mute:
        await this.applyMute({
          member: user,
          reason,
          guild: member.guild,
          self
        });

        break;

      case PunishmentType.Unban:
        await member.guild.unbanMember(member.id, `[${moderator.username}#${moderator.discriminator} | Unban] ${reason ? encodeURIComponent(reason) : 'No reason was specified.'}`);
        break;

      case PunishmentType.Unmute:
        await this.applyUnmute({
          settings,
          member: user,
          reason,
          guild: member.guild,
          self
        });

        break;

      case PunishmentType.VoiceMute:
        await this.applyVoiceMute({
          statement: modlogStatement,
          channelID: channelID!,
          member: user,
          reason,
          guild: member.guild,
          self
        });

        break;

      case PunishmentType.VoiceDeafen:
        await this.applyVoiceDeafen({
          statement: modlogStatement,
          channelID: channelID!,
          member: user,
          reason,
          guild: member.guild,
          self
        });

        break;

      case PunishmentType.VoiceUnmute:
        await this.applyVoiceUnmute({
          statement: modlogStatement,
          channelID: channelID!,
          member: user,
          reason,
          guild: member.guild,
          self
        });

        break;

      case PunishmentType.VoiceUndeafen:
        await this.applyVoiceUndeafen({
          statement: modlogStatement,
          channelID: channelID!,
          member: user,
          reason,
          guild: member.guild,
          self
        });

        break;
    }

    if (publish) {
      await this.publishToModLog(modlogStatement);
    }
  }

  private async applyBan(member: Member, guild: Guild, reason: string) {
    // noop
  }

  private async applyUnmute({
    settings,
    reason,
    member,
    guild,
    self
  }: ApplyUnmuteOptions) {
    // noop
  }

  private async applyMute({ reason, member, guild, self }: ApplyActionOptions) {
    // noop
  }

  private async applyVoiceMute({ reason, member, guild, self, channelID, statement }: ApplyGenericVoiceAction) {
    // noop
  }

  private async applyVoiceDeafen({ reason, member, guild, self, channelID, statement }: ApplyGenericVoiceAction) {
    // noop
  }

  private async applyVoiceUnmute({ reason, member, guild, self, channelID, statement }: ApplyGenericVoiceAction) {
    // noop
  }

  private async applyVoiceUndeafen({ reason, member, guild, self, channelID, statement }: ApplyGenericVoiceAction) {
    // noop
  }

  private async bulkPublish(items: PublishModLogOptions[]) {
    // noop
  }

  private async publishToModLog({
    warningsRemoved,
    warningsAdded,
    moderator,
    channel,
    reason,
    victim,
    time
  }: PublishModLogOptions) {
    // noop
  }
}
