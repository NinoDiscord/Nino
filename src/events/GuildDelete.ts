import { Guild } from 'eris';
import Client from '../structures/Bot';
import Event from '../structures/Event';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export default class GuildLeftEvent extends Event {
  constructor(@inject(TYPES.Bot) client: Client) {
    super(client, 'guildDelete');
  }

  async emit(guild: Guild) {
    this.bot.settings.remove(guild.id);
    this.bot.logger.log('discord', `Left ${guild.name} (${guild.id})`); // eslint-disable-line
    this.bot.status.updateStatus();
    this.bot.prometheus.guildCount.dec();
    this.bot.stats.guildCount--;
    await this.bot.redis.set('guilds', this.bot.client.guilds.size);
  }
}
