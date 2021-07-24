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

import PunishmentService, {
  PunishmentEntryType,
} from '../services/PunishmentService';
import { Constants, Guild, Member } from 'eris';
import { Inject, Subscribe } from '@augu/lilith';
import { PunishmentType } from '../entities/PunishmentsEntity';
import AutomodService from '../services/AutomodService';
import Database from '../components/Database';
import Discord from '../components/Discord';

interface OldMember {
  premiumSince: number | null;
  pending: boolean;
  nick?: string;
  roles: string[];
}

export default class GuildMemberListener {
  @Inject
  private readonly punishments!: PunishmentService;

  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly automod!: AutomodService;

  private async findAuditLog(guild: Guild, member: Member) {
    if (
      !guild.members
        .get(this.discord.client.user.id)
        ?.permissions.has('viewAuditLogs')
    )
      return undefined;

    try {
      const audits = await guild.getAuditLog({
        limit: 3,
        actionType: Constants.AuditLogActions.MEMBER_ROLE_UPDATE,
      });
      return audits.entries
        .sort((a, b) => b.createdAt - a.createdAt)
        .find(
          (entry) =>
            entry.user.id !== this.discord.client.user.id && // Check if the user that did it was not Nino
            entry.targetID === member.id && // Check if the target ID is the member
            entry.user.id !== member.id // Check if the user isn't thereselves
        );
    } catch {
      return undefined;
    }
  }

  @Subscribe('guildMemberUpdate', { emitter: 'discord' })
  async onGuildMemberUpdate(guild: Guild, member: Member, old: OldMember) {
    const settings = await this.database.automod.get(guild.id);
    const gSettings = await this.database.guilds.get(guild.id);

    if (old.hasOwnProperty('nick') && member.nick !== old.nick) {
      if (settings !== undefined && settings.dehoist === false) return;

      const result = await this.automod.run('memberNick', member);
      if (result) return;
    }

    if (
      (old.nick !== undefined || old.nick !== null) &&
      member.nick !== old.nick
    ) {
      if (settings !== undefined && settings.dehoist === false) return;

      const result = await this.automod.run('memberNick', member);
      if (result) return;
    }

    if (member.user.bot) return;

    if (gSettings.mutedRoleID === undefined) return;

    // taken away
    if (
      !member.roles.includes(gSettings.mutedRoleID) &&
      old.roles.includes(gSettings.mutedRoleID)
    ) {
      const entry = await this.findAuditLog(guild, member);
      if (!entry) return;

      await this.punishments.apply({
        moderator: entry.user,
        member,
        reason: '[Automod] Moderator has removed the Muted role',
        type: PunishmentType.Unmute,
      });
    }

    // added it
    if (
      member.roles.includes(gSettings.mutedRoleID) &&
      !old.roles.includes(gSettings.mutedRoleID)
    ) {
      const entry = await this.findAuditLog(guild, member);
      if (!entry) return;

      await this.punishments.apply({
        moderator: entry.user,
        member,
        reason: '[Automod] Moderator has added the Muted role',
        type: PunishmentType.Mute,
      });
    }
  }

  @Subscribe('guildMemberAdd', { emitter: 'discord' })
  async onGuildMemberJoin(guild: Guild, member: Member) {
    const result = await this.automod.run('memberJoin', member);
    if (result) return;

    const cases = await this.database.cases.getAll(guild.id);
    const all = cases
      .filter((c) => c.victimID === member.id)
      .sort((c) => c.index);

    if (all.length > 0 && all[all.length - 1]?.type === PunishmentType.Mute) {
      await this.punishments.apply({
        moderator: this.discord.client.user,
        member,
        reason: '[Automod] Mute Evading',
        type: PunishmentType.Mute,
      });
    }
  }

  @Subscribe('guildMemberRemove', { emitter: 'discord' })
  async onGuildMemberRemove(guild: Guild, member: Member) {
    const logs = await guild
      .getAuditLog({
        limit: 3,
        actionType: Constants.AuditLogActions.MEMBER_KICK,
      })
      .catch(() => undefined);

    if (logs === undefined) return;

    if (!logs.entries.length) return;

    const entry = logs.entries.find(
      (entry) =>
        entry.targetID === member.id &&
        entry.user.id !== this.discord.client.user.id
    );

    if (!entry) return;

    const model = await this.database.cases.create({
      attachments: [],
      moderatorID: entry.user.id,
      victimID: entry.targetID,
      guildID: guild.id,
      reason: '[Automod] User was kicked by moderator',
      type: PunishmentType.Kick,
    });

    await this.punishments['publishToModLog'](
      {
        moderator: entry.user,
        victim: this.discord.client.users.get(entry.targetID)!,
        reason: `[Automod] Automatic kick: ${entry.reason ?? 'unknown'}`,
        guild,
        type: PunishmentEntryType.Kicked,
      },
      model
    );
  }
}
