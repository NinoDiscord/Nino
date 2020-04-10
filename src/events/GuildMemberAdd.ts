import { Punishment, PunishmentType } from '../structures/managers/PunishmentManager';
import { injectable, inject } from 'inversify';
import { Guild, Member } from 'eris';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';

@injectable()
export default class GuildMemberJoinedEvent extends Event {
  constructor(@inject(TYPES.Bot) client: Client) {
    super(client, 'guildMemberAdd');
  }

  async emit(guild: Guild, member: Member) {
    this.bot.automod.handleMemberJoin(member);

    const cases = await this.bot.cases.getAll(guild.id);
    const all = cases.sort(m => m.id).filter(m => m.victim === member.id);
    if (all.length > 0) {
      const latest = all[all.length - 1];
      if (latest.type === 'mute') {
        const punishment = new Punishment(PunishmentType.Mute, {
          moderator: this.bot.client.user
        });

        await this.bot.punishments.punish(member, punishment, '[Automod] Mute Evading');
      }
    }
  }
}