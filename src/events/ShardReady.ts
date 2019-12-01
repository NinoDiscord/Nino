import Client from '../structures/Bot';
import Event from '../structures/Event';

export default class ShardReadyEvent extends Event {
    constructor(client: Client) {
        super(client, 'shardReady');
    }

    async emit(id: number) {
        this.bot.logger.log('discord', `Shard #${id} is ready!`);
    }
}