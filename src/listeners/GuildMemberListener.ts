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

import { Constants, Guild, Member } from 'eris';
import { Inject, LinkParent } from '@augu/lilith';
import ListenerService from '../services/ListenerService';
import AutomodService from '../services/AutomodService';
import Subscribe from '../structures/decorators/Subscribe';
import Database from '../components/Database';
import Discord from '../components/Discord';

interface OldMember {
  premiumSince: number | null;
  pending: boolean;
  nick?: string;
  roles: string[];
}

@LinkParent(ListenerService)
export default class GuildMemberListener {
  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  @Inject
  private automod!: AutomodService;

  private async findAuditLog(guild: Guild, member: Member) {
    if (!guild.members.get(this.discord.client.user.id)?.permissions.has('viewAuditLogs'))
      return undefined;

    const audits = await guild.getAuditLogs(3, undefined, Constants.AuditLogActions.MEMBER_ROLE_UPDATE);
    return audits.entries.sort((a, b) => b.createdAt - a.createdAt).find(entry =>
      entry.user.id !== this.discord.client.user.id && // Check if the user that did it was not Nino
      entry.targetID === member.id && // Check if the target ID is the member
      entry.user.id !== member.id  // Check if the user isn't thereselves
    );
  }

  @Subscribe('guildMemberUpdate')
  async onGuildMemberUpdate(guild: Guild, member: Member, old: OldMember) {
    const settings = await this.database.automod.get(guild.id);
    const gSettings = await this.database.guilds.get(guild.id);

    if (settings !== undefined && settings.dehoist === false)
      return;

    if (member.nick !== old.nick) {
      if ((await this.automod.run('memberNick', member)) === true)
        return;
    }

    if (member.user.bot)
      return;

    if (gSettings.mutedRoleID === undefined)
      return;

    // taken away
    if (!member.roles.includes(gSettings.mutedRoleID) && old.roles.includes(gSettings.mutedRoleID)) {
      const entry = await this.findAuditLog(guild, member);
    }
  }
}

/*
    // Muted role was taken away
    if (!member.roles.includes(settings.mutedRole) && old.roles.includes(settings.mutedRole)) {
      const entries = logs.entries.filter(entry => entry.targetID === member.id).sort((a, b) => b.createdAt - a.createdAt);

      const entry = entries[0];
      if (!entry || entry.user.id === this.client.user.id) return;

      const punishment = new Punishment(PunishmentType.Unmute, {
        moderator: entry.user
      });

      const caseModel = await this.punishmentService.createCase(member, punishment, '[Automod] Moderator removed the Muted role');

      await this.punishmentService.postToModLog(caseModel);
    }

    // Muted role was added
    if (member.roles.includes(settings.mutedRole) && !old.roles.includes(settings.mutedRole)) {
      const entries = logs.entries.filter(entry =>
        // Find the removal of the mute without it being by the bot
        entry.actionType === Constants.AuditLogActions.MEMBER_ROLE_UPDATE && entry.targetID === member.id
      ).sort((a, b) => b.createdAt - a.createdAt);

      const entry = entries[0];

      if (!entry || entry.user.id === this.client.user.id) return;

      const punishment = new Punishment(PunishmentType.Mute, {
        moderator: entry.user
      });

      const caseModel = await this.punishmentService.createCase(member, punishment, '[Automod] Moderator added the Muted role');

      await this.punishmentService.postToModLog(caseModel);
    }
*/
