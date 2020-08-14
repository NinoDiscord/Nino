import { Punishment, PunishmentType } from '../structures/services/PunishmentService';
import { Guild, Member, Constants } from 'eris';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';

@injectable()
export default class GuildMemberUpdateEvent extends Event {
  constructor(
    @inject(TYPES.Bot) client: Client
  ) {
    super(client, 'guildMemberUpdate');
  }

  async emit(guild: Guild, member: Member, old: { roles: string[]; nick: string }) {
    // Fetch guild settings
    const settings = await this.bot.settings.get(guild.id);

    // Automod handles nicknames (only)
    if (member.nick != old.nick) return this.bot.automod.handleMemberNameUpdate(member);
    if (!settings || !settings.mutedRole) return; // Muted role doesn't exist, don't do anything

    
    // Fetch audit logs
    if (!guild.members.get(this.bot.client.user.id)!.permission.has('viewAuditLogs')) return;
    const logs = await guild.getAuditLogs(10);
    if (!logs.entries.length) return; // Don't do anything if there is no entries

    // If the member is a bot, don't do anything
    if (member.user.bot) return;

    // Role was taken away
    if (!member.roles.includes(settings.mutedRole) && old.roles.includes(settings.mutedRole)) {
      const entries = logs.entries.filter(entry =>
        // Make sure the log type is 25 (MEMBER_ROLE_UPDATE) and it wasn't a bot
        entry.actionType === Constants.AuditLogActions.MEMBER_ROLE_UPDATE && !entry.user.bot
      );

      // Check if the first entry is the bot itself
      if (entries[0].user.id === this.bot.client.user.id) return;
      else {
        const all = entries.filter(x => x.user.id !== this.bot.client.user.id);
        if (!all.length) return;

        const log = all[0];
        const punishment = new Punishment(PunishmentType.Unmute, {
          moderator: log.user
        });
  
        await this.bot.punishments.punish(member, punishment, '[Automod] Moderator removed the Muted role', true);
      }
    } 
    
    if (member.roles.includes(settings.mutedRole) && !old.roles.includes(settings.mutedRole)) {
      const entries = logs.entries.filter(entry =>
        // Make sure the log action is 25 (MEMBER_ROLE_UPDATE) and it wasn't a bot
        entry.actionType === Constants.AuditLogActions.MEMBER_ROLE_UPDATE && !entry.user.bot
      );

      if (!entries.length) return; // Don't do anything if no entries were found

      // Check if the first entry is the bot itself
      if (entries[0].user.id === this.bot.client.user.id) return;
      else {
        const all = entries.filter(x => x.user.id !== this.bot.client.user.id);
        if (!all.length) return;

        const log = all[0];
        const punishment = new Punishment(PunishmentType.Mute, {
          moderator: log.user
        });
    
        await this.bot.punishments.punish(member, punishment, '[Automod] Moderator added the Muted role', true);
      }
    }
  }
}
