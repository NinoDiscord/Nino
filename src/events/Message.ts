import { Message } from 'eris';
import Client from '../structures/Bot';
import Event from '../structures/Event';

export default class MessageReceivedEvent extends Event {
  constructor(client: Client) {
    super(client, 'messageCreate');
  }

  async emit(m: Message) {
    this.bot.manager.service.handle(m);
    this.bot.autoModService.handleMessage(m);
  }
}
