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
        if (Number(arg) < 2) return ctx.send('');
    }
}