import Client from '../structures/Client';
import Event from '../structures/Event';

export default class ShardReadyEvent extends Event {
    constructor(client: Client) {
        super(client, 'shardReady');
    }

    async emit(id: number) {
        this.client.logger.log('discord', `Shard #${id} is ready!`);
    }
}