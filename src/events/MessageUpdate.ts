import { Message } from 'eris';
import Client from '../structures/Bot';
import Event from '../structures/Event';

export default class MessageUpdatedEvent extends Event {
  constructor(client: Client) {
    super(client, 'messageUpdate');
  }

  async emit(m: Message) {
    this.bot.autoModService.handleMessage(m);
  }
}
