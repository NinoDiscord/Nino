import Client from '../structures/Bot';
import Event from '../structures/Event';

export default class ShardResumedEvent extends Event {
    constructor(client: Client) {
        super(client, 'shardResume');
    }

    async emit(id: number) {
        this.bot.logger.log('discord', `Shard #${id} has resumed!`);
    }
}