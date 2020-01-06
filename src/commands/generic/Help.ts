import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { TYPES } from '../../types';
import Context from '../../structures/Context';
import Command from '../../structures/Command';
import Bot from '../../structures/Bot';

@injectable()
export default class HelpCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'help',
      description: (bot) => `Gives a list of ${bot.client.user ? bot.client.user.username : 'Nino#0989'}'s commands or shows documentation on a specific command`,
      usage: '[command]',
      aliases: ['cmds', 'commands']
    });
  }

  getAllCategories() {
    const commands = this.bot.manager.commands.filter(x => !x.hidden);
    const categories: { [x: string]: Command[]; } = {};
    for (const command of commands) {
      if (!(command.category in categories)) categories[command.category] = [];
      categories[command.category].push(command);
    }

    return categories;
  }

  async run(ctx: Context) {
    const settings = await ctx.getSettings();
    const categories = this.getAllCategories();

    if (!ctx.args.has(0)) {
      const embed = this.bot.getEmbed()
        .setTitle(`${this.bot.client.user.username}#${this.bot.client.user.discriminator} | COmmands List`)
        .setDescription(stripIndents`
          More information is avaliable on the [website](https://nino.augu.dev)!
          There are currently **${this.bot.manager.commands.size}** commands avaliable!
        `)
        .setFooter(`Use "${settings!.prefix}help <command name>" to get documentation on a specific command`);

      for (const category in categories) {
        if (category.length > 0) embed.addField(`${category} [${categories[category].length}]`, categories[category].map(s => `\`${s.name}\``).join(', '));
      }

      return ctx.embed(embed.build());
    }
    else {
      const arg = ctx.args.get(0);
      const command = this.bot.manager.commands.filter(s => s.name === arg)[0];

      if (!command) return ctx.send(`Sorry, I was not able to find the command \`${arg}\``);
      else {
        const embed = command.help();
        return ctx.embed(embed);
      }
    }
  }
}