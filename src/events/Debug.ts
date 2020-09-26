import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';

@injectable()
export default class DebugEvent extends Event {
  constructor(
      @inject(TYPES.Bot) client: Client
  ) {
    super(client, 'debug');
  }

  async emit(message: string) {
    if (this.bot.config.environment === 'production') return;

    this.bot.logger.debug(message);
  }
}