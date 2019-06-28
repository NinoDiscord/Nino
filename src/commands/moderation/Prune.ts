import { Constants } from 'eris';
import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class PruneCommand extends Command {
    public filters: string[];

    constructor(client: NinoClient) {
        super(client, {
            name: 'prune',
            description: 'Prunes messages from the current channel',
            usage: '<amount> [--filter="bot" | "user" | "new"]',
            aliases: ['purge'],
            category: 'Moderation',
            userpermissions: Constants.Permissions.manageMessages,
            botpermissions: Constants.Permissions.manageMessages
        });

        this.filters = ['bot', 'user', 'new'];
    }

    async run(ctx: Context) {
        if (!ctx.args.has(0)) return ctx.send('You must provide 1-2 arguments. Check the command usage.');

        const arg = ctx.args.get(0);
        if (Number(arg) < 2) return ctx.send('The `amount` must be greater or equal to 2.');
        if (Number(arg) > 100) return ctx.send('The `amount` must be less then or equal to 100.');

        const messages = await ctx.message.channel.getMessages(Number(arg));
        const filter   = (ctx.flags.get('filter') || ctx.flags.get('f'));
        if (typeof filter === 'boolean') return ctx.send('The `filter` flag must be a string.');
        if (!this.filters.includes(filter)) return ctx.send(`Invalid filter. (\`${this.filters.map(s => s).join(', ')}\`)`);

        // do more shit here
    }
}