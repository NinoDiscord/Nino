import PunishmentService, { Punishment, PunishmentType } from '../structures/services/PunishmentService';
import { inject, injectable } from 'inversify';
import { Client, Guild, Member } from 'eris';
import { TYPES } from '../types';
import Bot from '../structures/Bot';
import Event from '../structures/Event';
import AutomodService from '../structures/services/AutomodService';
import CaseSettingsService from '../structures/services/settings/CaseSettingsService';

@injectable()
export default class GuildMemberJoinedEvent extends Event {
  constructor(
      @inject(TYPES.Bot) bot: Bot,
      @inject(TYPES.Client) private client: Client,
      @inject(TYPES.AutoModService) private automodService: AutomodService,
      @inject(TYPES.CaseSettingsService) private caseSettingsService: CaseSettingsService,
      @inject(TYPES.PunishmentService) private punishmentService: PunishmentService
  ) {
    super(bot, 'guildMemberAdd');
  }

  async emit(guild: Guild, member: Member) {
    await this.automodService.handleMemberJoin(member);

    const cases = await this.caseSettingsService.getAll(guild.id);

    const allCases = cases
      .filter(c => c.victim === member.id)
      .sort(c => c.id);

    if (allCases.length > 0) {
      const latest = allCases[allCases.length - 1];

      if (latest.type === PunishmentType.Mute) {

        const punishment = new Punishment(PunishmentType.Mute, {
          moderator: this.client.user
        });

        await this.punishmentService.punish(member, punishment, '[Automod] Mute Evading');
      }
    }
  }
}
