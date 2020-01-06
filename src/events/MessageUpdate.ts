import { injectable, inject } from 'inversify';
import { Message } from 'eris';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';

@injectable()
export default class MessageUpdatedEvent extends Event {
  constructor(
    @inject(TYPES.Bot) client: Client
  ) {
    super(client, 'messageUpdate');
  }

  async emit(m: Message) {
    this.bot.automod.handleMessage(m);
    this.bot.manager.service.handle(m);
  }
}