import Client from '../structures/Bot';
import Event from '../structures/Event';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export default class ReadyEvent extends Event {
  constructor(@inject(TYPES.Bot) client: Client) {
    super(client, 'ready');
  }

  async emit() {
    this.bot.logger.log(
      'discord',
      `Logged in as ${this.bot.client.user.username}#${this.bot.client.user.discriminator} (${this.bot.client.user.id})`
    );
    this.bot.status.updateStatus();
    setInterval(() => 
      this.bot.status.updateStatus(),
    600000);
    this.bot.prometheus.server.listen(5595, () =>
      this.bot.logger.log('info', 'Metrics is now listening on port \'5595\'')
    );
    await this.bot.redis.set('guilds', this.bot.client.guilds.size);
    this.bot.stats.guildCount = this.bot.client.guilds.size;
    this.bot.prometheus.guildCount.set(this.bot.stats.guildCount, Date.now());
    this.bot.botlistservice.start();
    this.bot.timeouts.reapplyTimeouts();
  }
}