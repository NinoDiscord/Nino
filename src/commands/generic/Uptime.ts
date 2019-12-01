import { humanize } from '../../util';
import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class UptimeCommand extends Command {
    constructor(client: Bot) {
        super(client, {
            name: 'uptime',
            description: 'Gives you the uptime for the bot.',
            aliases: ['up'],
            category: 'Generic',
            ownerOnly: false
        });
    }

    async run(ctx: Context) {
        return ctx.send(humanize(Date.now() - this.bot.client.startTime));
    }
}