import { stripIndents } from 'common-tags';
import NinoClient from '../../structures/Client';
import Context from '../../structures/Context';
import Command from '../../structures/Command';

export default class HelpCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'help',
            description: (client: NinoClient) => `Gives a list of ${client.user.username}'s commands or shows documentation on a command`,
            usage: '[command]',
            aliases: ['cmds', 'commands']
        });
    }

    async run(ctx: Context) {
        const settings = await this.client.settings.get(ctx.guild.id);
        const categories: {
            [x: string]: string[];
        } = {};

        if (ctx.args.has(0)) {
            this
                .client
                .manager
                .commands
                .filter(s => !s.hidden)
                .forEach((command) => {
                    if (!(command.category in categories)) categories[command.category] = [];
                    categories[command.category].push(command.name);
                });

            const embed = this
                .client
                .getEmbed()
                .setTitle(`${this.client.user.username}#${this.client.user.discriminator} | Commands List`)
                .setDescription(stripIndents`
                    **Use ${settings!.prefix}help [command] to get documentation on a command**
                    There are currently **${this.client.manager.commands.size}** commands available
                `);

            for (const cat in categories) embed.addField(cat, categories[cat].map(s => `**\`${s}\`**`).join(', '));

            ctx.embed(embed.build());
        } else {
            const arg = ctx.args.get(0);
            const command = this.client.manager.commands.filter((s) =>
                s.name === arg
            )[0];

            if (!command) return ctx.send(`Sorry, I was not able to find the command \`${arg}\``);
            else {
                const embed = command.help();
                return ctx.embed(embed.build());
            }
        }
    }
}