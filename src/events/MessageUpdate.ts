import { Message } from 'eris';
import Client from '../structures/Bot';
import Event from '../structures/Event';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export default class MessageUpdatedEvent extends Event {
  constructor(@inject(TYPES.Bot) client: Client) {
    super(client, 'messageUpdate');
  }

  async emit(m: Message) {
    this.bot.autoModService.handleMessage(m);
  }
}
