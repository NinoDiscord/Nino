import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';

@injectable()
export default class ShardDisconnectedEvent extends Event {
  constructor(
    @inject(TYPES.Bot) client: Client
  ) {
    super(client, 'shardDisconnect');
  }

  async emit(id: number, error: any) {
    this.bot.logger.warn(`Shard #${id} died`, error);
  }
}