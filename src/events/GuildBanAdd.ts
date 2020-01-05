import { Punishment, PunishmentType, } from '../structures/managers/PunishmentManager';
import { inject, injectable } from 'inversify';
import { Guild, User } from 'eris';
import { TYPES } from '../types';
import Event from '../structures/Event';
import Bot from '../structures/Bot';

@injectable()
export default class GuildBanAddEvent extends Event {
  constructor(
    @inject(TYPES.Bot) bot: Bot
  ) {
    super(bot, 'guildBanAdd');
  }

  // TODO: only checks for bans
  // make it so when it's a kick/role add|delete/unban etc
  async emit(guild: Guild, user: User) {
    console.log(guild, user);
    const punishment = new Punishment(PunishmentType.Ban, {
      moderator: this.bot.client.user,
    });

    await this.bot.punishments.punish(
      guild.members.get(user.id) || { id: user.id, guild },
      punishment,
      'Automod (Context Menu)'
    );
  }
}
