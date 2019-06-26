import Client from '../structures/Client';
import Event from '../structures/Event';

export default class ShardResumedEvent extends Event {
    constructor(client: Client) {
        super(client, 'shardResume');
    }

    async emit(id: number) {
        this.client.logger.discord(`Shard #${id} has resumed!`);
    }
}