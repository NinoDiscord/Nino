import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';

@injectable()
export default class ShardResumedEvent extends Event {
  constructor(
    @inject(TYPES.Bot) client: Client
  ) {
    super(client, 'shardResume');
  }

  async emit(id: number) {
    this.bot.logger.info(`Shard #${id} has resumed it's connection`);
  }
}
