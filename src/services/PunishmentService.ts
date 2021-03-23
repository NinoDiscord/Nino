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

import { Constants, Guild, Member, User } from 'eris';
import { Inject, Service } from '@augu/lilith';
import { PunishmentType } from '../entities/PunishmentsEntity';
import { Logger } from 'tslog';
import Database from '../components/Database';
import Discord from '../components/Discord';
import Permissions from '../util/Permissions';

type MemberLike = Member | { id: string; guild: Guild };

interface ApplyPunishmentOptions {
  moderator: Member;
  publish?: boolean;
  reason?: string;
  member: MemberLike;
  type: PunishmentType;
}

interface PublishModLogOptions {
  warningsRemoved?: number;
  warningsAdded?: number;
  moderator: User;
  reason?: string;
  victim: User;
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

  permissionsFor(type: PunishmentType) {
    switch (type) {
      case PunishmentType.RoleRemove:
      case PunishmentType.RoleAdd:
      case PunishmentType.Unmute:
      case PunishmentType.Mute:
        return Constants.Permissions.manageRoles;

      case PunishmentType.VoiceDeafen:
        return Constants.Permissions.voiceDeafenMembers;

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

    //if (results.length) {
    //  await this.bulkPublish();
    //} else {
    //  await this.publishToModLog();
    //}

    return this.database.warnings.create({
      guildID: member.guild.id,
      reason,
      amount: count,
      userID: member.id
    });
  }

  async removeWarning(member: Member, reason?: string, amount?: number | 'all') {
    const self = member.guild.members.get(this.discord.client.user.id)!;
    const warnings = await this.database.warnings.get(member.guild.id, member.id);
    if (warnings === undefined)
      throw new SyntaxError('user doesn\'t have any punishments to be removed');

    if (amount === 'all') {
      await this.database.warnings.clean(member.guild.id, member.id);
      return this.publishToModLog();
    } else {
      const count = amount !== undefined ? (warnings.amount - amount) : (warnings.amount - 1);
      return this.publishToModLog();
    }
  }

  async apply({
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

    switch (type) {
      case PunishmentType.Ban:
        await this.applyBan(type, member, member.guild, reason);
        break;

      case PunishmentType.Kick: {
        const mem = await this.resolveMember(member);
        await mem.kick(reason
          ? `[${moderator.username}#${moderator.discriminator} (${moderator.id}) | Kick] ${encodeURIComponent(reason)}`
          : `[${moderator.username}#${moderator.discriminator} (${moderator.id}) | Kick] No reason was specified.`
        );
      } break;

      case PunishmentType.Mute:
        await this.applyMute();
        break;
    }
  }
}
