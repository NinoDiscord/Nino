import { stripIndents } from 'common-tags';
import Bot from '../../structures/Bot';
import Context from '../../structures/Context';
import Command from '../../structures/Command';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class HelpCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'help',
      description: (bot: Bot) =>
        `Gives a list of ${
          bot.client.user ? bot.client.user.username : 'Nino #0989'
        }'s commands or shows documentation on a command`,
      usage: '[command]',
      aliases: ['cmds', 'commands'],
    });
  }

  async run(ctx: Context) {
    const settings = await ctx.getSettings();
    const categories: {
      [x: string]: string[];
    } = {};

    if (!ctx.args.has(0)) {
      this.bot.manager.commands
        .filter(s => !s.hidden)
        .forEach(command => {
          if (!(command.category in categories))
            categories[command.category] = [];
          categories[command.category].push(command.name);
        });

      const embed = this.bot
        .getEmbed()
        .setTitle(
          `${ctx.client.user.username}#${ctx.client.user.discriminator} | Commands List`
        )
        .setDescription(
          stripIndents`
                    More information is available on the [website](https://nino.augu.dev)!
                    There are currently **${this.bot.manager.commands.size}** commands available
                `
        )
        .setFooter(
          `Use ${
            settings!.prefix
          }help [command] to get documentation regarding a command`
        );

      for (const cat in categories)
        if (cat.length > 0)
          embed.addField(
            cat.toUpperCase(),
            categories[cat].map(s => `\`${s}\``).join(', ')
          );

      return ctx.embed(embed.build());
    } else {
      const arg = ctx.args.get(0);
      const command = this.bot.manager.commands.filter(s => s.name === arg)[0];

      if (!command)
        return ctx.send(`Sorry, I was not able to find the command \`${arg}\``);
      else {
        const embed = command.help();
        return ctx.embed(embed);
      }
    }
  }
}
