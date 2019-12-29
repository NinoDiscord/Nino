import { Guild } from 'eris';
import Client from '../structures/Bot';
import Event from '../structures/Event';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export default class GuildJoinedEvent extends Event {
  constructor(@inject(TYPES.Bot) client: Client) {
    super(client, 'guildCreate');
  }

  async emit(guild: Guild) {
    this.bot.settings.create(guild.id);
    this.bot.logger.log('discord', `Joined ${guild.name} (${guild.id})`);
    this.bot.status.updateStatus();
    this.bot.prom.guildCount.inc();
    this.bot.stats.guildCount++;
    await this.bot.redis.set('guilds', this.bot.client.guilds.size);
  }
}
