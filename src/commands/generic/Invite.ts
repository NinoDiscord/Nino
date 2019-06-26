import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class InviteCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'invite',
            description: 'Gives you the invite for the bot.',
            aliases: ['inv'],
            category: 'Generic',
            ownerOnly: false
        });
    }

    async run(ctx: Context) {
        ctx.send('You can invite the bot here: <insert invite with permissions shit here>');
    }
}