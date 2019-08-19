import Client from '../structures/Client';
import Event from '../structures/Event';

export default class ShardDisconnectedEvent extends Event {
    constructor(client: Client) {
        super(client, 'shardDisconnect');
    }

    async emit(id: number, error: any) {
        this.client.logger.log('discord', `Shard #${id} has disconnected!\n${error}`);
    }
}