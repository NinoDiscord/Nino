import { Punishment, PunishmentType } from '../structures/managers/PunishmentManager';
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
    const logs = await guild.getAuditLogs(10);
    if (!logs.entries.length) return; // Don't do anything if there is no entries

    const roles = ([] as string[]).concat(
      old.roles.map(x => x),
      member.roles.map(x => x)
    );

    // Role was taken away
    if (old.roles.includes(settings.mutedRole)) {
      const entries = logs.entries.filter(entry =>
        // Make sure the log type is 25 (MEMBER_ROLE_UPDATE) and it wasn't Nino who added it
        entry.actionType === Constants.AuditLogActions.MEMBER_ROLE_UPDATE && entry.user.id !== this.bot.client.user.id  
      );

      if (!entries.length) return; // Don't do anything if no entries were found

      const log = entries[0];
      const punishment = new Punishment(PunishmentType.Unmute, {
        moderator: log.user
      });

      await this.bot.punishments.punish(member, punishment, '[Automod] Moderator has removed the Muted role', true);
    } 
    
    if (member.roles.includes(settings.mutedRole)) {
      const entries = logs.entries.filter(entry =>
        // Make sure the log action is 25 (MEMBER_ROLE_UPDATE) and it wasn't Nino who added it
        entry.actionType === Constants.AuditLogActions.MEMBER_ROLE_UPDATE && entry.user.id !== this.bot.client.user.id  
      );

      if (!entries.length) return; // Don't do anything if no entries were found

      const log = entries[0];
      const punishment = new Punishment(PunishmentType.Mute, {
        moderator: log.user
      });

      await this.bot.punishments.punish(member, punishment, '[Automod] Moderator added the Muted role', true);
    }
  }
}