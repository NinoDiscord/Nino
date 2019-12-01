import Client from '../structures/Bot';
import Event from '../structures/Event';

export default class ShardDisconnectedEvent extends Event {
  constructor(client: Client) {
    super(client, 'shardDisconnect');
  }

  async emit(id: number, error: any) {
    this.bot.logger.log('discord', `Shard #${id} has disconnected!\n${error}`);
  }
}
