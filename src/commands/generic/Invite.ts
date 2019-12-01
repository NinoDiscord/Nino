import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class InviteCommand extends Command {
    constructor(client: Bot) {
        super(client, {
            name: 'invite',
            description: 'Gives you the invite for the bot.',
            aliases: [ 'inv' ],
            category: 'Generic',
            ownerOnly: false
        });
    }

    async run(ctx: Context) {
        return ctx.send(`:link: Here you go: <https://discordapp.com/oauth2/authorize?client_id=${this.bot.client.user.id}&scope=bot>`);
    }
}