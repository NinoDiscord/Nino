import { inject, injectable } from 'inversify';
import { Message, TextChannel } from 'eris';
import { TYPES } from '../types';
import Bot from '../structures/Bot';
import Event from '../structures/Event';
import CommandService from '../structures/services/CommandService';
import AutomodService from '../structures/services/AutomodService';

@injectable()
export default class MessageReceivedEvent extends Event {
  constructor(
      @inject(TYPES.Bot) bot: Bot,
      @inject(TYPES.CommandService) private commandService: CommandService,
      @inject(TYPES.AutoModService) private automodService: AutomodService
  ) {
    super(bot, 'messageCreate');
  }

  async emit(m: Message<TextChannel>) {
    await this.commandService.handle(m);
    await this.automodService.handleMessage(m);
  }
}
