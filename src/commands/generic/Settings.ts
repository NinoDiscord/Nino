import { Constants, TextChannel } from 'eris';
import { injectable, inject } from 'inversify';
import { replaceMessage } from '../../util';
import { TYPES } from '../../types';
import Context from '../../structures/Context';
import Command from '../../structures/Command';
import Bot from '../../structures/Bot';
import ms = require('ms');

@injectable()
export default class SettingsCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'settings',
      description: 'View or edit the guild\'s settings.',
      aliases: ['options'],
      usage:
        'set <key> <value> / reset <key> / view / add <warnings> <punishment> [--time <time> (mute/ban)] [<roleID> (role/unrole)] [--soft (ban)] [--days <amount> (ban: delete messages)] / remove <punishment index> / response <add|remove> <message>',
      userPermissions: Constants.Permissions.manageGuild,
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    const subcommand = ctx.args.get(0);
    switch (subcommand) {
      case 'set': return this.set(ctx);
      case 'reset': return this.reset(ctx);
      case 'view': return this.view(ctx, true);
      case 'add': return this.add(ctx);
      case 'remove': return this.remove(ctx);
      case 'disable': return this.disable(ctx);
      case 'enable': return this.enable(ctx);
      case 'response': return this.response(ctx);
      default: return this.view(ctx, false);
    }
  }

  async add(ctx: Context) {
    const warnings = ctx.args.get(1);
    const punishment = ctx.args.get(2);
    const punishments = ['ban', 'mute', 'unmute', 'kick', 'role', 'unrole'];
    const locale = await ctx.getLocale();

    if (!warnings || !(/^[0-9]$/).test(warnings) || Number(warnings) < 1 || Number(warnings) > 5) {
      const required = locale.translate('commands.generic.settings.add.amountRequired');
      return ctx.send(required);
    }

    if (!punishments.includes(punishment)) {
      const all = punishments.join(', ');
      const invalid = locale.translate('commands.generic.settings.add.invalidPunishment', {
        punishments: all,
        punishment
      });

      return ctx.send(invalid);
    }
  
    const temp = ctx.flags.get('time');
    if (temp && (typeof temp === 'boolean') || (typeof temp === 'string') && (!ms(temp as string) || ms(temp as string) < 1000)) {
      const invalid = locale.translate('commands.generic.settings.add.invalidTime');
      return ctx.send(invalid);
    }

    const soft = ctx.flags.get('soft');
    if (soft && typeof soft === 'string') {
      const invalid = locale.translate('global.invalidFlag.boolean');
      return ctx.send(invalid);
    }

    const roleID = ctx.args.get(3);
    if (!roleID && (['unrole', 'role'].includes(punishment))) {
      const invalid = locale.translate('commands.generic.settings.add.missingRoleID');
      return ctx.send(invalid);
    }

    if (roleID && !((/^[0-9]+$/).test(roleID) || !ctx.guild!.roles.has(roleID))) {
      const invalid = locale.translate('commands.generic.settings.add.invalidRole');
      return ctx.send(invalid);
    }

    const days = ctx.flags.get('days');
    if (days && (typeof days === 'boolean' || (typeof days === 'string') && !(/^[0-9]{1,2}$/).test(days))) {
      const invalid = locale.translate('commands.generic.settings.add.invalidDays');
      return ctx.send(invalid);
    }

    this.bot.settings.update(ctx.guild!.id, {
      $push: {
        punishments: {
          warnings: Number(warnings),
          roleID,
          type: punishment,
          temp: temp ? ms(temp as string) : null,
          soft,
          days: days ? Number(days) : null
        }
      }
    }, (error, packet) => {
      if (error) return ctx.send(locale.translate('commands.generic.settings.add.errored'));
      if (packet.n) return ctx.send(locale.translate('commands.generic.settings.add.success'));
      else return ctx.send(locale.translate('commands.generic.settings.add.amountExceeded'));
    });
  }

  async remove(ctx: Context) {
    const index = ctx.args.get(1);
    const locale = await ctx.getLocale();

    if (!index || !/^[0-9]+$/.test(index) || Number(index) < 1) {
      const invalid = locale.translate('commands.generic.settings.remove.invalidIndex');
      return ctx.send(invalid);
    }

    const settings = await ctx.getSettings();
    if (!settings || !settings.punishments.length) {
      const none = locale.translate('commands.generic.settings.remove.noPunishments');
      return ctx.send(none);
    }

    if (Number(index) <= settings!.punishments.length) {
      const i = Math.round(Number(index)) - 1;
      settings!.punishments.splice(i, 1);
    }

    const removed = locale.translate('commands.generic.settings.remove.success', { index });
    settings!.save();
    return ctx.send(removed);
  }

  async set(ctx: Context) {
    const setting = ctx.args.get(1);
    const subcommands = ['modlog', 'prefix', 'mutedrole', 'mutedRole', 'automod.swears', 'logging.channelID', 'logging.ignore'];
    const locale = await ctx.getLocale();
    
    switch (setting) {
      case 'modlog': {
        const channelID = ctx.args.get(2);
        if (!channelID) {
          const noChannel = locale.translate('commands.generic.settings.noChannel');
          return ctx.send(noChannel);
        }

        const id = channelID.endsWith('>') ? channelID.includes('<#') ? channelID.substring(2, channelID.length - 1) : channelID : /^[0-9]+/.test(channelID) ? channelID : null;
        if (id === null) {
          const invalidChannel = locale.translate('global.invalidChannel', { channel: channelID });
          return ctx.send(invalidChannel);
        }

        const channel = await this.bot.client.getRESTChannel(id);
        if (!(channel instanceof TextChannel)) {
          const notText = locale.translate('global.notText', { channel: channel.id });
          return ctx.send(notText);
        }

        const permissions = channel.permissionsOf(this.bot.client.user.id);
        if (!permissions.has('sendMessages') || !permissions.has('embedLinks')) {
          const text = locale.translate('commands.generic.settings.set.modlog.noPerms', { channel: channel.name });
          return ctx.send(text);
        }

        await ctx.bot.settings.update(ctx.guild!.id, {
          $set: {
            modlog: channel.id
          }
        }, (error) => {
          const message = error
            ? locale.translate('commands.generic.settings.set.modlog.unable', { channel: channel.name })
            : locale.translate('commands.generic.settings.set.modlog.success', { channel: channel.name });

          return ctx.send(message);
        });
      } break;
      case 'prefix': {
        const prefix = ctx.args.slice(2).join(' ');
        const settings = await ctx.getSettings()!;

        if (!prefix) {
          const none = locale.translate('commands.generic.settings.set.prefix.none');
          return ctx.send(none);
        }

        if (prefix.length > 20) {
          // Calculate the length of the prefix
          const length = prefix.length - 20;
          const over20 = locale.translate('commands.generic.settings.set.prefix.over20', { chars: length });
          return ctx.send(over20);
        }

        if (['@everyone', '@here'].includes(prefix)) {
          const pinged = locale.translate('commands.generic.settings.set.prefix.atEveryone');
          return ctx.send(pinged);
        }

        if (settings.prefix === prefix) {
          const already = locale.translate('commands.generic.settings.set.prefix.already', { prefix });
          return ctx.send(already);
        }

        ctx.bot.settings.update(ctx.guild!.id, {
          $set: {
            prefix
          }
        }, (error) => {
          const message = error 
            ? locale.translate('commands.generic.settings.set.prefix.unable', { prefix })
            : locale.translate('commands.generic.settings.set.prefix.success', { prefix });

          return ctx.send(message);
        });
      } break;
      case 'mutedrole':
      case 'mutedRole': {
        const mutedRole = ctx.args.get(2);
        if (!mutedRole || !/^[0-9]+$/.test(mutedRole)) {
          const message = !mutedRole ? 
            locale.translate('commands.generic.settings.set.mutedRole.none') :
            locale.translate('commands.generic.settings.set.mutedRole.invalid');

          return ctx.send(message);
        }

        const role = ctx.guild!.roles.find(role => role.id === mutedRole);
        if (!role) {
          const noneFound = locale.translate('commands.generic.settings.set.mutedRole.noneFound', { id: mutedRole });
          return ctx.send(noneFound);
        }

        const unable = locale.translate('commands.generic.settings.set.mutedRole.unable', { role: role.name });
        const success = locale.translate('commands.generic.settings.set.mutedRole.success', { role: role.name });
        this.bot.settings.update(ctx.guild!.id, {
          $set: {
            mutedRole: role.id
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.badwords':
      case 'automod.swears': {
        const list = ctx.args.get(2);
        if (!list) {
          const none = locale.translate('commands.generic.settings.set.badwords.none');
          return ctx.send(none);
        }

        const settings = await ctx.getSettings();
        const swears = ctx.args.slice(2);
        if (!settings!.automod.badwords.enabled) settings!.automod.badwords.enabled = true;
        settings!.automod.badwords.wordlist.push(...swears);
        await settings!.save();

        const message = !settings!.automod.badwords.enabled ?
          locale.translate('commands.generic.settings.set.badwords.added.notEnabled', { words: swears.length }) :
          locale.translate('commands.generic.settings.set.badwords.added.enabled', { words: swears.length });

        return ctx.send(message);
      }
      case 'logging.ignore':
      case 'logging.ignored': {
        const list = ctx.args.get(2);
        if (!list) {
          const none = locale.translate('commands.generic.settings.set.ignored.none');
          return ctx.send(none);
        }

        const settings = await ctx.getSettings();
        const channels = ctx.args.slice(2);
        const errors = channels.filter(channelID =>
          channelID.endsWith('>') ? channelID.includes('<#') ? channelID.substring(2, channelID.length - 1) : channelID : /^[0-9]+/.test(channelID) ? channelID : null
        );

        if (errors.some(e => e === null)) {
          const invalid = errors
            .filter(error => error === null)
            .map(s => `**${s}**`)
            .join(', ');

          const text = locale.translate('commands.generic.settings.set.ignored.invalid', { channels: invalid });
          return ctx.send(text);
        }

        if (!settings!.logging.enabled) settings!.logging.enabled = true;
        settings!.logging.ignore.push(...errors);
        await settings!.save();

        const notEnabled = locale.translate('commands.generic.settings.set.ignored.added.notEnabled', { channels: errors.length });
        const enabled = locale.translate('commands.generic.settings.set.ignored.added.enabled', { channels: errors.length });

        const message = !settings!.logging.enabled ?
          notEnabled :
          enabled;

        return ctx.send(message);
      }
      case 'logging.channelID': {
        const channelID = ctx.args.get(2);
        if (!channelID) {
          const noChannel = locale.translate('commands.generic.settings.noChannel');
          return ctx.send(noChannel);
        }

        const id = channelID.endsWith('>') ? channelID.includes('<#') ? channelID.substring(2, channelID.length - 1) : channelID : /^[0-9]+/.test(channelID) ? channelID : null;
        if (id === null) {
          const invalidChannel = locale.translate('global.invalidChannel', { channel: channelID });
          return ctx.send(invalidChannel);
        }

        const channel = await this.bot.client.getRESTChannel(id);
        if (!(channel instanceof TextChannel)) {
          const notText = locale.translate('global.notText', { channel: channel.id });
          return ctx.send(notText);
        }

        const permissions = channel.permissionsOf(this.bot.client.user.id);
        if (!permissions.has('sendMessages') || !permissions.has('embedLinks')) {
          const text = locale.translate('commands.generic.settings.set.logChannel.noPerms', { channel: channel.name });
          return ctx.send(text);
        }

        let error!: any;
        ctx.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.channelID': channel.id
          }
        }, (error) => error = error);

        const unable = locale.translate('commands.generic.settings.set.logChannel.unable', { channel: channel.name });
        const success = locale.translate('commands.generic.settings.enable.automod.success', { channel: channel.name });
        error ? ctx.send(unable) : ctx.send(success);
      } break;
      default: {
        const notFound = locale.translate('commands.generic.settings.noSubcommand', { subcommands: subcommands.join(', ') });
        const invalid = locale.translate('commands.generic.settings.invalidSubcommand', { 
          subcommand: setting, 
          subcommands: subcommands.join(', ') 
        });

        return ctx.send(setting === undefined ? notFound : invalid);
      }
    }
  }

  async enable(ctx: Context) {
    const setting = ctx.args.get(1);
    const subcommands = ['automod', 'automod.dehoist', 'automod.invites', 'automod.spam', 'automod.mention', 'automod.raid', 'automod.swears',  'automod.badwords', 'logging', 'logging.events', 'logging.events.messageDeleted', 'logging.events.messageDelete', 'logging.events.messageUpdate', 'logging.events.messageUpdated'];
    const locale = await ctx.getLocale();

    switch (setting) {
      case 'automod': {
        const unable = locale.translate('commands.generic.settings.enable.automod.unable');
        const success = locale.translate('commands.generic.settings.enable.automod.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.dehoist': true,
            'automod.spam': true,
            'automod.mention': true,
            'automod.raid': true,
            'automod.invites': true,
            'automod.badwords.enabled': true,
            'automod.badwords.wordlist': []
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.dehoist': {
        const unable = locale.translate('commands.generic.settings.enable.dehoist.unable');
        const success = locale.translate('commands.generic.settings.enable.dehoist.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.dehoist': true
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.spam': {
        const unable = locale.translate('commands.generic.settings.enable.spam.unable');
        const success = locale.translate('commands.generic.settings.enable.spam.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.spam': true
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.raid': {
        const unable = locale.translate('commands.generic.settings.enable.raid.unable');
        const success = locale.translate('commands.generic.settings.enable.raid.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.raid': true
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.mention': {
        const unable = locale.translate('commands.generic.settings.enable.mention.unable');
        const success = locale.translate('commands.generic.settings.enable.mention.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.mention': true
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.swears':
      case 'automod.badwords': {
        const unable = locale.translate('commands.generic.settings.enable.badwords.unable');
        const success = locale.translate('commands.generic.settings.enable.badwords.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.badwords.enabled': true
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.invites': {
        const unable = locale.translate('commands.generic.settings.enable.invites.unable');
        const success = locale.translate('commands.generic.settings.enable.invites.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.invites': true
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'logging': {
        const unable = locale.translate('commands.generic.settings.enable.logging.unable');
        const success = locale.translate('commands.generic.settings.enable.logging.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.enabled': true
          }
        }, error => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'logging.events': {
        const unable = locale.translate('commands.generic.settings.enable.logEvents.unable');
        const success = locale.translate('commands.generic.settings.enable.logEvents.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': true,
            'logging.events.messageUpdate': true
          }
        }, error => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'logging.events.messageDeleted':
      case 'logging.events.messageDelete': {
        const unable = locale.translate('commands.generic.settings.enable.messageDelete.unable');
        const success = locale.translate('commands.generic.settings.enable.messageDelete.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': true
          }
        }, error => error ? ctx.send(unable) : ctx.send(success)); 
      } break;
      case 'logging.events.messageUpdated':
      case 'logging.events.messageUpdate': {
        const unable = locale.translate('commands.generic.settings.enable.messageUpdate.unable');
        const success = locale.translate('commands.generic.settings.enable.messageUpdate.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageUpdate': true
          }
        }, error => error ? ctx.send(unable) : ctx.send(success)); 
      } break;
      default: {
        const notFound = locale.translate('commands.generic.settings.noSubcommand', { subcommands: subcommands.join(', ') });
        const invalid = locale.translate('commands.generic.settings.invalidSubcommand', { 
          subcommand: setting, 
          subcommands: subcommands.join(', ') 
        });

        return ctx.send(setting === undefined ? notFound : invalid);
      }
    }
  }

  async disable(ctx: Context) {
    const setting = ctx.args.get(1);
    const subcommands = ['automod', 'automod.dehoist', 'automod.invites', 'automod.spam', 'automod.mention', 'automod.raid', 'automod.swears or automod.badwords', 'logging', 'logging.events.messageDelete',  'logging.events.messageDeleted', 'logging.events.messageUpdate', 'logging.events.messageUpdated'];
    const locale = await ctx.getLocale();
    
    switch (setting) {
      case 'automod': {
        const unable = locale.translate('commands.generic.settings.disable.automod.unable');
        const success = locale.translate('commands.generic.settings.disable.automod.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.dehoist': false,
            'automod.spam': false,
            'automod.mention': false,
            'automod.raid': false,
            'automod.invites': false,
            'automod.badwords.enabled': false
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.dehoist': {
        const unable = locale.translate('commands.generic.settings.disable.dehoist.unable');
        const success = locale.translate('commands.generic.settings.disable.dehoist.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.dehoist': false
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.spam': {
        const unable = locale.translate('commands.generic.settings.disable.spam.unable');
        const success = locale.translate('commands.generic.settings.disable.spam.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.spam': false
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.raid': {
        const unable = locale.translate('commands.generic.settings.disable.raid.unable');
        const success = locale.translate('commands.generic.settings.disable.raid.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.raid': false
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.mention': {
        const unable = locale.translate('commands.generic.settings.disable.mention.unable');
        const success = locale.translate('commands.generic.settings.disable.mention.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.mention': false
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.swears':
      case 'automod.badwords': {
        const unable = locale.translate('commands.generic.settings.disable.badwords.unable');
        const success = locale.translate('commands.generic.settings.disable.badwords.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.badwords.enabled': false,
            'automod.badwords.wordlist': []
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'automod.invites': {
        const unable = locale.translate('commands.generic.settings.disable.invites.unable');
        const success = locale.translate('commands.generic.settings.disable.invites.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.invites': false
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'logging': {
        const unable = locale.translate('commands.generic.settings.disable.logging.unable');
        const success = locale.translate('commands.generic.settings.disable.logging.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.enabled': false
          }
        }, error => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'logging.events': {
        const unable = locale.translate('commands.generic.settings.disable.logEvents.unable');
        const success = locale.translate('commands.generic.settings.disable.logEvents.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': false,
            'logging.events.messageUpdate': false
          }
        }, error => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'logging.events.messageDeleted':
      case 'logging.events.messageDelete': {
        const unable = locale.translate('commands.generic.settings.disable.messageDelete.unable');
        const success = locale.translate('commands.generic.settings.disable.messageDelete.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': false
          }
        }, error => error ? ctx.send(unable) : ctx.send(success)); 
      } break;
      case 'logging.events.messageUpdated':
      case 'logging.events.messageUpdate': {
        const unable = locale.translate('commands.generic.settings.disable.messageUpdate.unable');
        const success = locale.translate('commands.generic.settings.disable.messageUpdate.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageUpdate': false
          }
        }, error => error ? ctx.send(unable) : ctx.send(success)); 
      } break;
      default: {
        const notFound = locale.translate('commands.generic.settings.noSubcommand', { subcommands: subcommands.join(', ') });
        const invalid = locale.translate('commands.generic.settings.invalidSubcommand', { 
          subcommand: setting, 
          subcommands: subcommands.join(', ') 
        });

        return ctx.send(setting === undefined ? notFound : invalid);
      }
    }
  }

  async reset(ctx: Context) {
    const locale = await ctx.getLocale();
    const subcommands = ['punishments', 'modlog', 'mutedrole', 'prefix'];
    const setting = ctx.args.get(1);

    switch (setting) {
      case 'punishments': {
        const unable = locale.translate('commands.generic.settings.reset.punishments.unable');
        const success = locale.translate('commands.generic.settings.reset.punishments.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'punishments': []
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'prefix': {
        const unable = locale.translate('commands.generic.settings.reset.prefix.unable');
        const success = locale.translate('commands.generic.settings.reset.prefix.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'prefix': this.bot.config.discord.prefix
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'modlog': {
        const unable = locale.translate('commands.generic.settings.reset.modlog.unable');
        const success = locale.translate('commands.generic.settings.reset.modlog.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'modlog': null
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      case 'mutedrole': {
        const unable = locale.translate('commands.generic.settings.reset.mutedRole.unable');
        const success = locale.translate('commands.generic.settings.reset.mutedRole.success');

        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'mutedRole': null
          }
        }, (error) => error ? ctx.send(unable) : ctx.send(success));
      } break;
      default: {
        const notFound = locale.translate('commands.generic.settings.noSubcommand', { subcommands: subcommands.join(', ') });
        const invalid = locale.translate('commands.generic.settings.invalidSubcommand', { 
          subcommand: setting, 
          subcommands: subcommands.join(', ') 
        });

        return ctx.send(setting === undefined ? notFound : invalid);
      }
    }
  }

  async view(ctx: Context, provided: boolean = false) {
    const settings = await ctx.getSettings()!;
    const locale = await ctx.getLocale();

    const title = locale.translate('commands.generic.settings.view.title', {
      guild: ctx.guild!.name
    });

    const yes = locale.translate('global.yes');
    const no = locale.translate('global.no');
    const events: string[] = [];

    if (settings.logging.events.messageUpdate) events.push('Message Updates');
    if (settings.logging.events.messageDelete) events.push('Message Deletions');

    const desc = locale.translate('commands.generic.settings.view.description', {
      prefix: settings.prefix,
      mutedRole: ctx.guild!.roles.find(x => x.id === settings.mutedRole) ? ctx.guild!.roles.get(settings.mutedRole)!.name : 'None',
      modlog: ctx.guild!.channels.find(x => x.id === settings.modlog) ? ctx.guild!.channels.get(settings.modlog)!.name : 'None',
      logging: ctx.guild!.channels.find(x => x.id === settings.logging.channelID) ? ctx.guild!.channels.get(settings.logging.channelID)!.name : 'None',
      events: events.join(', '),
      punishments: settings.punishments.length ? settings.punishments.map((punishment, index) => 
        `[${index + 1}] ${punishment.type} with ${punishment.warnings} warnings${punishment.temp ? ` with time ${ms(punishment.temp)}` : punishment.soft ? ' as a softban' : punishment.roleid ? ` with role ${ctx.guild!.roles.get(punishment.roleid)!.name}` : ''}`
      ) : 'None',
      'dehoist.enabled': settings.automod.dehoist ? yes : no,
      'mention.enabled': settings.automod.mention ? yes : no,
      'invites.enabled': settings.automod.invites ? yes : no,
      'raid.enabled': settings.automod.raid ? yes : no,
      'spam.enabled': settings.automod.spam ? yes : no,
      'logging.enabled': settings.logging.enabled ? yes : no,
      'badwords.enabled': settings.automod.badwords ? yes : no
    });

    const footer = locale.translate('commands.generic.settings.view.footer');

    const embed = this.bot.getEmbed()
      .setTitle(title)
      .setDescription(desc);

    if (!provided) embed.setFooter(footer);
    return ctx.embed(embed);
  }

  async response(ctx: Context) {
    const subcommands = ['add', 'remove'];
    const subcommand = ctx.args.get(1);
    switch (subcommand) {
      case 'add': {
        const other = ctx.args.get(2);
        const otherCmds = ['badwords', 'invite', 'mention', 'spam'];
        switch (other) {
          case 'badwords': {
            if (!ctx.args.has(3)) return ctx.send('No message was provided');

            const message = ctx.args.slice(3).join(' ');
            const settings = await ctx.getSettings();
            const doc = {
              'responses.badwords.enabled': true,
              'responses.badwords.message': message
            };

            if (!settings!.automod.badwords.enabled) doc['automod.badwords.enabled'] = true;
            const setted = doc.hasOwnProperty('automod.badwords.enabled') ?
              `All responses to the bad words automod feature will now be \`${message}\`\nExample: **${replaceMessage(message, ctx.sender)}**\nSince you didn't enable the automod feature, I've enabled it for you!` :
              `All responses to the bad words automod feature will now be \`${message}\`\nExample: **${replaceMessage(message, ctx.sender)}**`;

            await this.bot.settings.update(ctx.guild!.id, {
              $set: doc
            }, error => error ? ctx.send(`Unable to set the bad words automod feature response to: \`${message}\``) : ctx.send(setted));
          } break;

          case 'invites': {
            if (!ctx.args.has(3)) return ctx.send('No message was provided');

            const message = ctx.args.slice(3).join(' ');
            const settings = await ctx.getSettings();
            const doc = {
              'responses.invites.enabled': true,
              'responses.invites.message': message
            };

            if (!settings!.automod.invites) doc['automod.invites'] = true;
            const setted = doc.hasOwnProperty('automod.invites') ?
              `All responses to the invite automod feature will now be \`${message}\`\nExample: **${replaceMessage(message, ctx.sender)}**\nSince you didn't enable the automod feature, I've enabled it for you!` :
              `All responses to the invite automod feature will now be \`${message}\`\nExample: **${replaceMessage(message, ctx.sender)}**`;

            await this.bot.settings.update(ctx.guild!.id, {
              $set: doc
            }, error => error ? ctx.send(`Unable to set the invite automod feature response to: \`${message}\``) : ctx.send(setted));
          } break;

          case 'mention': {
            if (!ctx.args.has(3)) return ctx.send('No message was provided');

            const message = ctx.args.slice(3).join(' ');
            const settings = await ctx.getSettings();
            const doc = {
              'responses.mention.enabled': true,
              'responses.mention.message': message
            };

            if (!settings!.automod.mention) doc['automod.mention'] = true;
            const setted = doc.hasOwnProperty('automod.mention') ?
              `All responses to the mention automod feature will now be \`${message}\`\nExample: **${replaceMessage(message, ctx.sender)}**\nSince you didn't enable the automod feature, I've enabled it for you!` :
              `All responses to the mention automod feature will now be \`${message}\`\nExample: **${replaceMessage(message, ctx.sender)}**`;

            await this.bot.settings.update(ctx.guild!.id, {
              $set: doc
            }, error => error ? ctx.send(`Unable to set the mention automod feature response to: \`${message}\``) : ctx.send(setted));
          } break;

          case 'spam': {
            if (!ctx.args.has(3)) return ctx.send('No message was provided');

            const message = ctx.args.slice(3).join(' ');
            const settings = await ctx.getSettings();
            const doc = {
              'responses.spam.enabled': true,
              'responses.spam.message': message
            };

            if (!settings!.automod.spam) doc['automod.spam'] = true;
            const setted = doc.hasOwnProperty('automod.spam') ?
              `All responses to the spam automod feature will now be \`${message}\`\nExample: **${replaceMessage(message, ctx.sender)}**\nSince you didn't enable the automod feature, I've enabled it for you!` :
              `All responses to the spam automod feature will now be \`${message}\`\nExample: **${replaceMessage(message, ctx.sender)}**`;

            await this.bot.settings.update(ctx.guild!.id, {
              $set: doc
            }, error => error ? ctx.send(`Unable to set the spam automod feature response to: \`${message}\``) : ctx.send(setted));
          } break;

          default: return ctx.send(other === undefined ? `No automod feature subcommand was found (${otherCmds.join(', ')})` : `Invalid automod feature subcommand "${other}" (${otherCmds.join(', ')})`);
        }
      } break;

      case 'add': {
        const other = ctx.args.get(2);
        const otherCmds = ['badwords', 'invite', 'mention', 'spam'];
        switch (other) {
          case 'badwords': {
            await this.bot.settings.update(ctx.guild!.id, {
              $set: {
                'response.badwords.enabled': false,
                'response.badwords.message': null
              }
            }, error => error ? ctx.send('Unable to disable the badwords automod\'s response message') : ctx.send('Disabled the response for the badwords automod feature'));
          } break;

          case 'invites': {
            await this.bot.settings.update(ctx.guild!.id, {
              $set: {
                'response.invites.enabled': false,
                'response.invites.message': null
              }
            }, error => error ? ctx.send('Unable to disable the invites automod\'s response message') : ctx.send('Disabled the response for the invites automod feature'));
          } break;

          case 'mention': {
            await this.bot.settings.update(ctx.guild!.id, {
              $set: {
                'response.mention.enabled': false,
                'response.mention.message': null
              }
            }, error => error ? ctx.send('Unable to disable the mention automod\'s response message') : ctx.send('Disabled the response for the mention automod feature'));
          } break;

          case 'spam': {
            await this.bot.settings.update(ctx.guild!.id, {
              $set: {
                'response.spam.enabled': false,
                'response.spam.message': null
              }
            }, error => error ? ctx.send('Unable to disable the spam automod\'s response message') : ctx.send('Disabled the response for the spam automod feature'));
          } break;

          default: return ctx.send(other === undefined ? `No automod feature subcommand was found (${otherCmds.join(', ')})` : `Invalid automod feature subcommand "${other}" (${otherCmds.join(', ')})`);
        }
      }

      default: return ctx.send(subcommand === undefined ? `No subcommand was found (${subcommands.join(', ')})` : `Invalid subcommand "${subcommand}" (${subcommands.join(', ')})`);
    }
  }
}
