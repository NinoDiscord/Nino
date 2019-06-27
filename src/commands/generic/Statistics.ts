import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class StatisticsCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'statistics',
            description: 'Gives you the bot\'s statistics',
            aliases: ['stats'],
            category: 'Generic',
            ownerOnly: false
        });
    }

    async run(ctx: Context) {
        return ctx.send(`code`);
    }
}