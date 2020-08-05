import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import UserSettingsService from '../../structures/services/settings/UserSettingsService';
import { createEmptyEmbed } from '../../util/EmbedUtils';
import Eris from 'eris';
import { GuildModel } from '../../models/GuildSchema';
import LocalizationManager from '../../structures/managers/LocalizationManager';
import { UserModel } from '../../models/UserSchema';
import GuildSettingsService from '../../structures/services/settings/GuildSettingsService';

@injectable()
export default class ShardInfoCommand extends Command {
  constructor(
    @inject(TYPES.Bot) bot: Bot,
    @inject(TYPES.GuildSettingsService) private guildSettings: GuildSettingsService,
    @inject(TYPES.UserSettingsService) private userSettings: UserSettingsService,
    @inject(TYPES.Client) private client: Eris.Client,
    @inject(TYPES.LocalizationManager) private localizationManager: LocalizationManager
  ) {
    super(bot, {
      name: 'locale',
      description: 'View or edit a user or guild\'s locale',
      aliases: ['lang', 'language'],
      guildOnly: true,
      usage: 'locale / locale list / locale reset [--guild] / locale set <locale> [--guild]'
    });
  }

  async run(ctx: Context) {
    const userSettings = await this.userSettings.getOrCreate(ctx.sender.id);
    const settings = await ctx.getSettings()!;

    if (!ctx.args.has(0)) {
      return this.showLocale(ctx, settings, userSettings);
    }

    const subcommand = ctx.args.get(0);
    switch (subcommand) {
      case 'list': return this.listSubCommand(settings, ctx);
      case 'reset': return this.resetLocale(ctx);
      case 'set': {
        if (!ctx.args.has(1)) return ctx.sendTranslate('commands.generic.locale.set.none', { prefix: settings.prefix });

        return this.setLocale(ctx, settings);
      } 

      default: return ctx.sendTranslate('commands.generic.locale.invalidSubcommand', {
        subcommand
      });
    }
  }

  private showLocale(ctx: Context, settings: GuildModel, userSettings: UserModel) {
    const botUser = this.client.user;

    const title = ctx.translate('commands.generic.locale.embed.title', {
      username: `${botUser.username}#${botUser.discriminator}`
    });

    const description = ctx.translate('commands.generic.locale.embed.description', {
      server: settings.locale,
      prefix: settings.prefix,
      user: userSettings.locale
    });

    const embed = createEmptyEmbed()
      .setTitle(title)
      .setDescription(description)
      .build();

    return ctx.embed(embed);
  }

  private listSubCommand(settings: GuildModel, ctx: Context) {
    {
      const locales = this.localizationManager.map(locale => locale.translate('commands.generic.locale.list.locale', {
        flag: locale.flag,
        full: locale.full,
        translator: locale.translator,
        contributors: locale.contributors.length,
        prefix: settings.prefix,
        code: locale.code
      })
      ).join('\n');

      const embed = createEmptyEmbed()
        .setTitle(ctx.translate('commands.generic.locale.list.title', {
          username: `${ctx.bot.client.user.username}#${ctx.bot.client.user.discriminator}`
        }))
        .setDescription(locales)
        .build();

      return ctx.embed(embed);
    }
  }

  private resetLocale(ctx: Context) {
    const guild = ctx.flags.get('guild');

    if (guild) {
      if (typeof guild === 'string') return ctx.sendTranslate('globals.invalidFlag.boolean', { flag: 'guild' });

      return this.guildSettings.update(ctx.guild!.id, {
        $set: {
          'locale': 'en_US'
        }
      }, (error) =>  ctx.sendTranslate(error ? 'commands.generic.locale.reset.unable:guild' : 'commands.generic.locale.reset.success:guild'));
    }
      
    return this.userSettings.update(ctx.sender.id, {
      $set: {
        'locale': 'en_US'
      }
    }, (error) =>  ctx.sendTranslate(error ? 'commands.generic.locale.reset.unable:user' : 'commands.generic.locale.reset.success:user'));
  }

  private setLocale(ctx: Context, settings: GuildModel) {
    const code = ctx.args.get(1);
    const language = this.localizationManager.getLocale(code);

    if (language === null) return ctx.sendTranslate('commands.generic.locale.set.invalid', { locale: code, prefix: settings.prefix });

    const guild = ctx.flags.get('guild');
    if (guild) {
      if (typeof guild === 'string') return ctx.sendTranslate('globals.invalidFlag.boolean', { flag: 'guild' });

      return this.guildSettings.update(ctx.guild!.id, {
        $set: {
          'locale': language.code
        }
      }, (error) =>  ctx.sendTranslate(error ? 'commands.generic.locale.set.unable:guild' : 'commands.generic.locale.set.success:guild', { locale: language.code }));
    } 
    return  this.userSettings.update(ctx.sender.id, {
      $set: {
        'locale': language.code
      }
    }, (error) => ctx.sendTranslate(error ?  'commands.generic.locale.set.unable:user' : 'commands.generic.locale.set.success:user', { locale: language.code }));
  }
}
