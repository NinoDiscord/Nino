import { Guild, Member } from 'eris';
import Client from '../structures/Bot';
import Event from '../structures/Event';
import {
  Punishment,
  PunishmentType,
} from '../structures/managers/PunishmentManager';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export default class GuildMemberUpdateEvent extends Event {
  constructor(@inject(TYPES.Bot) client: Client) {
    super(client, 'guildMemberUpdate');
  }

  async emit(
    guild: Guild,
    member: Member,
    old: { roles: string[]; nick: string }
  ) {
    if (member.nick != old.nick)
      this.bot.autoModService.handleMemberNameUpdate(member);
  }
}
