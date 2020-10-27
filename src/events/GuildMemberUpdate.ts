import PunishmentService, { Punishment, PunishmentType } from '../structures/services/PunishmentService';
import { Client, Constants, Guild, Member } from 'eris';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import Bot from '../structures/Bot';
import Event from '../structures/Event';
import GuildSettingsService from '../structures/services/settings/GuildSettingsService';
import AutomodService from '../structures/services/AutomodService';

@injectable()
export default class GuildMemberUpdateEvent extends Event {
  constructor(
      @inject(TYPES.Bot) bot: Bot,
      @inject(TYPES.Client) private client: Client,
      @inject(TYPES.PunishmentService) private punishmentService: PunishmentService,
      @inject(TYPES.GuildSettingsService) private guildSettingsService: GuildSettingsService,
      @inject(TYPES.AutoModService) private automodService: AutomodService
  ) {
    super(bot, 'guildMemberUpdate');
  }

  async emit(guild: Guild, member: Member, old: { roles: string[]; nick: string }) {
    // Fetch guild settings
    const settings = await this.guildSettingsService.get(guild.id);

    // Automod handles nicknames (only)
    if (member.nick !== null && member.nick !== old.nick) return this.automodService.handleMemberNameUpdate(member);

    // If the member is a bot, don't do anything
    if (member.user.bot) return;

    if (!settings || !settings.mutedRole) return; // Muted role doesn't exist, don't do anything

    // Fetch audit logs
    if (!guild.members.get(this.client.user.id)!.permission.has('viewAuditLogs')) return;

    const logs = await guild.getAuditLogs(10, undefined, Constants.AuditLogActions.MEMBER_ROLE_UPDATE);
    if (!logs.entries.length) return; // Don't do anything if there is no entries

    // There are no roles updated?
    if (member.roles === null) return;

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
  }
}
