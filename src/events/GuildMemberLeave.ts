import PunishmentService, { Punishment, PunishmentType } from '../structures/services/PunishmentService';
import { Guild, Member, Constants, Client } from 'eris';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import Bot from '../structures/Bot';
import Event from '../structures/Event';

@injectable()
export default class GuildMemberLeftEvent extends Event {
  constructor(
      @inject(TYPES.Bot) bot: Bot,
      @inject(TYPES.PunishmentService) private punishments: PunishmentService,
      @inject(TYPES.Client) private client: Client
  ) {
    super(bot, 'guildMemberRemove');
  }

  async emit(guild: Guild, member: Member) {
    const logs = await guild.getAuditLogs(10, undefined, Constants.AuditLogActions.MEMBER_KICK);
    if (!logs.entries.length) return; // Don't do anything if there is no entries

    const entry = logs.entries.filter(entry => entry.targetID === member.id)[0];
    if (!entry || entry.user.id === this.client.user.id) return;

    const punishment = new Punishment(PunishmentType.Kick, { moderator: entry.user });
    const model = await this.punishments.createCase(member, punishment, entry.reason || undefined);
    await this.punishments.postToModLog(model);
  }
}
