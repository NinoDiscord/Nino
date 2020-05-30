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
      description: (bot) => `Gives a list of ${bot.client.user ? bot.client.user.username : 'Nino'}'s commands or shows documentation on a specific command`,
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
      const title = ctx.translate('commands.generic.help.embed.title', {
        username: `${ctx.bot.client.user.username}#${ctx.bot.client.user.discriminator}`
      });

      const description = ctx.translate('commands.generic.help.embed.description', {
        website: 'https://nino.augu.dev',
        commands: this.bot.manager.commands.size
      });

      const footer = ctx.translate('commands.generic.help.embed.footer', {
        prefix: settings ? settings.prefix : this.bot.config.discord.prefix
      });

      const embed = ctx.bot.getEmbed()
        .setTitle(title)
        .setDescription(description)
        .setFooter(footer);

      for (const category in categories) {
        const localized = ctx.translate(`commands.generic.help.categories.${category.toLowerCase()}`);
        embed.addField(`${localized} [${categories[category].length}]`, categories[category].map(s => `\`${s.name}\``).join(', '));
      }

      return ctx.embed(embed.build());
    } else {
      const arg = ctx.args.get(0);
      const command = ctx.bot.manager.getCommand(arg);

      const notFound = ctx.translate('commands.generic.help.notFound', {
        command: arg
      });

      if (!command) return ctx.send(notFound);
      else {
        const embed = await command.help(ctx);
        return ctx.embed(embed);
      }
    }
  }
}
