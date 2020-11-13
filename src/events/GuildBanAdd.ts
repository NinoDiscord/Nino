import PunishmentService, { Punishment, PunishmentType } from '../structures/services/PunishmentService';
import { inject, injectable } from 'inversify';
import { Client, Constants, Guild, User } from 'eris';
import { TYPES } from '../types';
import Event from '../structures/Event';
import Bot from '../structures/Bot';
import CaseSettingsService from '../structures/services/settings/CaseSettingsService';

@injectable()
export default class GuildBanAddEvent extends Event {
  constructor(
      @inject(TYPES.Bot) bot: Bot,
      @inject(TYPES.Client) private client: Client,
      @inject(TYPES.CaseSettingsService) private caseSettingsService: CaseSettingsService,
      @inject(TYPES.PunishmentService) private punishmentService: PunishmentService
  ) {
    super(bot, 'guildBanAdd');
  }

  async emit(guild: Guild, user: User) {
    if (!guild.members.get(this.client.user.id)!.permission.has('viewAuditLogs')) {
      return;
    }
    const logs = await guild.getAuditLogs(10);

    const logEntry = logs.entries.find(entry =>
    // Check if the action was ban and if Nino didn't do it
      entry.actionType === Constants.AuditLogActions.MEMBER_BAN_ADD && entry.user.id !== this.client.user.id && entry.targetID === user.id
    );

    if (!logEntry) return;

    const mod = this.client.users.get(logEntry.user.id)!;

    const punishment = new Punishment(PunishmentType.Ban, {
      moderator: mod
    });

    const member = guild.members.get(user.id) || {
      id: user.id,
      guild,
      username: user.username,
      discriminator: user.discriminator
    };
    const caseModel = await this.punishmentService.createCase(member, punishment, logEntry.reason || undefined);
    return this.punishmentService.postToModLog(caseModel);
  }
}
