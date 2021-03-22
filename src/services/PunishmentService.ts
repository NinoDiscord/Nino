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

import { Constants, Member } from 'eris';
import { Inject, Service } from '@augu/lilith';
import { PunishmentType } from '../entities/PunishmentsEntity';
import Database from '../components/Database';
import Discord from '../components/Discord';

export default class PunishmentService implements Service {
  public name: string = 'punishments';

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

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
    const warnings = await this.database.warnings.getAll(member.guild.id, member.id);
    const latest = warnings[warnings.length - 1];
    const count = latest
      ? (amount !== undefined ? latest.amount + amount : latest.amount + 1)
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
    const warnings = await this.database.warnings.getAll(member.guild.id, member.id);
    const latest = warnings[warnings.length - 1];
    if (latest === undefined)
      throw new SyntaxError('user doesn\'t have any punishments to be removed');
  }
}
