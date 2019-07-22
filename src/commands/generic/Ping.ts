import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class PingCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'ping',
            description: 'Gives you the bot\'s ping.',
            aliases: [ 'pong', 'pang' ],
            category: 'Generic',
            ownerOnly: false
        });
    }

    async run(ctx: Context) {
        const startedAt = Date.now();
        const message = await ctx.send(':pong: Pong, I guess? Why do you want it...?');
        await message.delete();
        return ctx.send(`:ping_pong: Pong! \`${Date.now() - startedAt}ms\``);
    }
}