import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';

@injectable()
export default class ReadyEvent extends Event {
  constructor(
    @inject(TYPES.Bot) client: Client
  ) {
    super(client, 'ready');
  }

  async emit() {
    const name = `${this.bot.client.user.username}#${this.bot.client.user.discriminator} (${this.bot.client.user.id})`;

    this.bot.logger.info(`Logged in as ${name}`);
    this.bot.status.updateStatus();
    setInterval(() => this.bot.status.updateStatus(), 600000);

    this.bot.prometheus.server.listen(this.bot.config.prometheus, () => this.bot.logger.info(`Metrics server is now listening at localhost:${this.bot.config.prometheus}`));
    await this.bot.redis.set('guilds', this.bot.client.guilds.size);

    this.bot.statistics.guildCount = this.bot.client.guilds.size;
    this.bot.prometheus.guildCount.set(this.bot.statistics.guildCount, Date.now());
    this.bot.timeouts.reapplyTimeouts();
  }
}