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

import PunishmentService, { PunishmentEntryType } from '../services/PunishmentService';
import { Constants, Guild, User } from 'eris';
import { Inject, LinkParent } from '@augu/lilith';
import { PunishmentType } from '../entities/PunishmentsEntity';
import ListenerService from '../services/ListenerService';
import Subscribe from '../structures/decorators/Subscribe';
import Database from '../components/Database';
import Discord from '../components/Discord';
import app from '../container';

@LinkParent(ListenerService)
export default class GuildBansListener {
  @Inject
  private punishments!: PunishmentService;

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  @Subscribe('guildBanAdd')
  async onGuildBanAdd(guild: Guild, user: User) {
    if (!guild.members.get(this.discord.client.user.id)?.permissions.has('viewAuditLogs')) {
      return;
    }

    const audits = await guild.getAuditLogs(3, undefined, Constants.AuditLogActions.MEMBER_BAN_ADD);
    const entry = audits.entries.find(entry => entry.targetID === user.id && entry.user.id !== this.discord.client.user.id);

    if (entry === undefined)
      return;

    const caseModel = await this.database.cases.create({
      moderatorID: entry.user.id,
      victimID: entry.targetID,
      guildID: entry.guild.id,
      reason: entry.reason ?? 'No reason was provided',
      type: PunishmentType.Ban
    });

    await this.punishments['publishToModLog']({
      moderator: this.discord.client.users.get(entry.user.id)!,
      victim: this.discord.client.users.get(entry.targetID)!,
      reason: entry.reason ?? 'No reason was provided',
      guild: entry.guild,
      type: PunishmentEntryType.Banned
    }, caseModel);
  }

  @Subscribe('guildBanRemove')
  async onGuildBanRemove(guild: Guild, user: User) {
    if (!guild.members.get(this.discord.client.user.id)?.permissions.has('viewAuditLogs'))
      return;

    const audits = await guild.getAuditLogs(3, undefined, Constants.AuditLogActions.MEMBER_BAN_ADD);
    const entry = audits.entries.find(entry => entry.targetID === user.id && entry.user.id !== this.discord.client.user.id);

    if (entry === undefined)
      return;

    const caseModel = await this.database.cases.create({
      moderatorID: entry.user.id,
      victimID: entry.targetID,
      guildID: entry.guild.id,
      reason: entry.reason ?? 'No reason was provided',
      type: PunishmentType.Unban
    });

    await this.punishments['publishToModLog']({
      moderator: this.discord.client.users.get(entry.user.id)!,
      victim: this.discord.client.users.get(entry.targetID)!,
      reason: 'Moderator has unbanned on their own accord.',
      guild: entry.guild,
      type: PunishmentEntryType.Unban
    }, caseModel);
  }
}
