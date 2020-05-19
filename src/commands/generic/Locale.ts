import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class ShardInfoCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'locale',
      description: 'View or edit a user or guild\'s locale',
      aliases: ['lang', 'language'],
      category: 'Generic',
      guildOnly: true,
      usage: 'locale / locale list / locale reset [--guild] / locale set <locale> [--guild]'
    });
  }

  async run(ctx: Context) {
    const userSettings = await this.bot.userSettings.getOrCreate(ctx.sender.id);
    const settings = await ctx.getSettings()!;
    const locale = await ctx.getLocale();

    if (!ctx.args.has(0)) {
      const title = locale.translate('commands.generic.locale.embed.title', {
        username: `${ctx.bot.client.user.username}#${ctx.bot.client.user.discriminator} `
      });

      const description = locale.translate('commands.generic.locale.embed.description', {
        server: settings.locale,
        prefix: settings.prefix,
        user: userSettings.locale
      });

      const embed = this.bot.getEmbed()
        .setTitle(title)
        .setDescription(description)
        .build();

      return ctx.embed(embed);
    }

    const subcommand = ctx.args.get(0);
    switch (subcommand) {
      case 'list': {
        const locales = this.bot.locales.map(locale =>
          locale.translate('commands.generic.locale.list.locale', { flag: locale.flag, full: locale.full, translator: locale.translator, contributors: locale.contributors.length })
        ).join('\n');

        const embed = this.bot.getEmbed()
          .setTitle(locale.translate('commands.generic.locale.list.title', {
            username: `${ctx.bot.client.user.username}#${ctx.bot.client.user.discriminator} `
          }))
          .setDescription(locales)
          .build();

        return ctx.embed(embed);
      }

      case 'reset': {
        const guild = ctx.flags.get('guild');
        if (guild) {
          if (typeof guild === 'string') return ctx.send(locale.translate('globals.invalidFlag.boolean', { flag: 'guild' }));

          await this.bot.settings.update(ctx.guild!.id, {
            $set: {
              'locale': 'en_US'
            }
          }, (error) => error ? ctx.send(locale.translate('commands.generic.locale.reset.unable:guild')) : ctx.send(locale.translate('commands.generic.locale.reset.success:guild')));
        } else {
          await this.bot.userSettings.update(ctx.sender.id, {
            $set: {
              'locale': 'en_US'
            }
          }, (error) => error ? ctx.send(locale.translate('commands.generic.locale.reset.unable:user')) : ctx.send(locale.translate('commands.generic.locale.reset.success:user')));
        }
      } break;

      case 'set': {
        if (!ctx.args.has(1)) return ctx.send(locale.translate('commands.generic.locale.set.none', { prefix: settings.prefix }));

        const code = ctx.args.get(1);
        const language = this.bot.locales.getLocale(code);
        if (language === null) return ctx.send(locale.translate('commands.generic.locale.set.invalid', { locale: code, prefix: settings.prefix }));

        const guild = ctx.flags.get('guild');
        if (guild) {
          if (typeof guild === 'string') return ctx.send(locale.translate('globals.invalidFlag.boolean', { flag: 'guild' }));

          await this.bot.settings.update(ctx.guild!.id, {
            $set: {
              'locale': language.code
            }
          }, (error) => error ? ctx.send(locale.translate('commands.generic.locale.set.unable:guild')) : ctx.send(locale.translate('commands.generic.locale.set.success:guild', { locale: language.code })));
        } else {
          await this.bot.userSettings.update(ctx.sender.id, {
            $set: {
              'locale': language.code
            }
          }, (error) => error ? ctx.send(locale.translate('commands.generic.locale.set.unable:user')) : ctx.send(locale.translate('commands.generic.locale.set.success:user', { locale: language.code })));
        }
      } break;

      default: return ctx.send(locale.translate('commands.generic.locale.invalidSubcommand', {
        subcommand
      }));
    }
  }
}
