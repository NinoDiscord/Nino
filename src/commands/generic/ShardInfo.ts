import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class ShardInfoCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'shardinfo',
            description: 'Gives you the bot shard info.',
            aliases: [ 'si', 'shards' ],
            category: 'Generic',
            ownerOnly: false
        });
    }

    async run(ctx: Context) {
        return ctx.send(`code`);
    }
}