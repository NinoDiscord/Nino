import Client from '../structures/Bot';
import Event from '../structures/Event';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export default class ShardResumedEvent extends Event {
  constructor(@inject(TYPES.Bot) client: Client) {
    super(client, 'shardResume');
  }

  async emit(id: number) {
    this.bot.logger.log('discord', `Shard #${id} has resumed!`);
  }
}
