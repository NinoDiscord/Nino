import { injectable, inject } from 'inversify';
import { Guild, Member } from 'eris';
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
    if (member.nick != old.nick) this.bot.automod.handleMemberNameUpdate(member);
  }
}