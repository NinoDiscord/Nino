import Client from '../structures/Bot';
import Event from '../structures/Event';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export default class ShardDisconnectedEvent extends Event {
  constructor(@inject(TYPES.Bot) client: Client) {
    super(client, 'shardDisconnect');
  }

  async emit(id: number, error: any) {
    this.bot.logger.log('discord', `Shard #${id} has disconnected!\n${error}`);
  }
}
