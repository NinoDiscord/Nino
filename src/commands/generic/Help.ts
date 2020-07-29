import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { TYPES } from '../../types';
import Context from '../../structures/Context';
import Command from '../../structures/Command';
import Bot, { Config } from '../../structures/Bot';
import CommandManager from '../../structures/managers/CommandManager';
import Eris from 'eris';
import { createEmptyEmbed } from '../../util/EmbedUtils';
import { lazyInject } from '../../inversify.config';

@injectable()
export default class HelpCommand extends Command {
  @lazyInject(TYPES.CommandManager)
  private commandManager!: CommandManager;
  private client: Eris.Client;
  private config: Config;

  constructor(
        @inject(TYPES.Bot) bot: Bot, 
        @inject(TYPES.Client) client: Eris.Client,
        @inject(TYPES.Config) config: Config
  ) {
    super(bot, {
      name: 'help',
      description: (bot) => `Gives a list of ${bot.client.user ? bot.client.user.username : 'Nino'}'s commands or shows documentation on a specific command`,
      usage: '[command]',
      aliases: ['cmds', 'commands']
    });
    this.client = client;
    this.config = config;
  }

  private getAllCategories() {
    const commands = this.commandManager.commands.filter(x => !x.hidden);
    const categories: { [x: string]: Command[]; } = {};
    for (const command of commands) {
      if (!(command.category in categories)) categories[command.category] = [];
      categories[command.category].push(command);
    }

    return categories;
  }

  private async sendCommandList(ctx: Context) {
    const settings = await ctx.getSettings();
    const categories = this.getAllCategories();
    const commands = this.commandManager.commands;
    const botUser = this.client.user;

    const title = ctx.translate('commands.generic.help.embed.title', {
      username: `${botUser.username}#${botUser.discriminator}`
    });

    const description = ctx.translate('commands.generic.help.embed.description', {
      website: 'https://nino.augu.dev',
      commands: commands.size
    });

    const footer = ctx.translate('commands.generic.help.embed.footer', {
      prefix: settings ? settings.prefix : this.config.discord.prefix
    });

    const embed = createEmptyEmbed()
      .setTitle(title)
      .setDescription(description)
      .setFooter(footer);

    for (const category in categories) {
      const localized = ctx.translate(`commands.generic.help.categories.${category.toLowerCase()}`);
      embed.addField(`${localized} [${categories[category].length}]`, categories[category].map(s => `\`${s.name}\``).join(', '));
    }

    return ctx.embed(embed.build());
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) {
      return this.sendCommandList(ctx);
    }

    const arg = ctx.args.get(0);
    const command = this.commandManager.getCommand(arg);

    if (!command) {
      return ctx.sendTranslate('commands.generic.help.notFound', {
        command: arg
      });
    } else {
      const embed = await command.help(ctx);
      return ctx.embed(embed);
    }
  }
}
