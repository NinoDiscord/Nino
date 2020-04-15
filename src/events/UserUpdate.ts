import { injectable, inject } from 'inversify';
import { User, Member, GuildAuditLogEntry, Guild } from 'eris';
import { TYPES } from '../types';
import Event from '../structures/Event';
import Bot from '../structures/Bot';
import { textChangeRangeIsUnchanged } from 'typescript';

@injectable()
export default class UserUpdateEvent extends Event {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, 'userUpdate');
  }

  getMutualGuilds(user: User) {
    let members: Member[] = [];
    for (const guild of this.bot.client.guilds.values()) {
      if (guild.members.has(user.id)) members.push(guild.members.get(user.id)!);
    }

    return members;
  }

  async emit(user: User) {
    for (const member of this.getMutualGuilds(user)) this.bot.automod.handleMemberNameUpdate(member);
  }
}