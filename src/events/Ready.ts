import { inject, injectable } from 'inversify';
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

    if (this.bot.client.user.id === '531613242473054229') this.bot.botlists.start();

    await this.bot.redis.set('guilds', this.bot.client.guilds.size);
    this.bot.statistics.guildCount = this.bot.client.guilds.size;
    await this.bot.timeouts.reapplyTimeouts();
  }
}
