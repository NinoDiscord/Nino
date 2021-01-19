import { Constants, TextChannel } from 'eris';
import { injectable, inject } from 'inversify';
import { createEmptyEmbed } from '../../util/EmbedUtils';
import { firstUpper } from '../../util';
import { findId } from '../../util/UserUtil';
import { TYPES } from '../../types';
import Context from '../../structures/Context';
import Command from '../../structures/Command';
import Bot from '../../structures/Bot';
import ms = require('ms');

const MAX_PUNISHMENTS = 15;

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
      case 'view': return this.view(ctx);
      case 'add': return this.add(ctx);
      case 'remove': return this.remove(ctx);
      case 'disable': return this.disable(ctx);
      case 'enable': return this.enable(ctx);
      default: return this.view(ctx);
    }
  }

  private isBoolean(str: string | boolean) {
    return typeof str === 'boolean';
  }

  private isString(str: string | boolean) {
    return typeof str === 'string';
  }

  private isInteger(str: string) {
    return /[0-9]\d+/.test(str);
  }

  private isInRange(num: number | string, lowerBound: number, upperBound: number) {
    if (typeof num === 'string') num = Number(num);
    if (isNaN(num)) return false;

    return num >= lowerBound && num <= upperBound;
  }

  async add(ctx: Context) {
    const warnings = ctx.args.get(1);
    const punishment = ctx.args.get(2);
    const punishments = ['ban', 'mute', 'unmute', 'kick', 'role', 'unrole'];

    if (!warnings) return ctx.sendTranslate('commands.generic.settings.add.amountRequired');
    if (isNaN(Number(warnings))) return ctx.sendTranslate('global.nan');
    if (!this.isInRange(warnings, 1, 10)) return ctx.sendTranslate('commands.generic.settings.add.notInRange');

    if (!punishment) return ctx.sendTranslate('commands.generic.settings.add.noPunishment', {
      punishments: punishments.join(', ')
    });

    if (!punishments.includes(punishment)) {
      return ctx.sendTranslate('commands.generic.settings.add.invalidPunishment', {
        punishments: punishments.join(', '),
        punishment: punishment || '(none provided)'
      });
    }

    const temp = ctx.flags.get('time');
    if (temp && (this.isBoolean(temp) || (this.isString(temp) && (!ms(temp as string) || ms(temp as string) < 1000)))) {
      return ctx.sendTranslate('commands.generic.settings.add.invalidTime');
    }

    const soft = ctx.flags.get('soft');
    if (soft && typeof soft === 'string') {
      return ctx.sendTranslate('global.invalidFlag.boolean');
    }

    const roleID = ctx.args.get(3);
    if (!roleID && (['unrole', 'role'].includes(punishment))) {
      return ctx.sendTranslate('commands.generic.settings.add.missingRoleID');
    }

    if (roleID && (!this.isInteger(roleID) || !ctx.guild!.roles.has(roleID))) {
      return ctx.sendTranslate('commands.generic.settings.add.invalidRole');
    }

    const days = ctx.flags.get('days');
    if (days && (this.isBoolean(days) || this.isString(days) && !(/^[0-9]{1,2}$/).test(days as string))) {
      return ctx.sendTranslate('commands.generic.settings.add.invalidDays');
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
      if (error) return ctx.sendTranslate('commands.generic.settings.add.errored');
      if (packet.n) return ctx.sendTranslate('commands.generic.settings.add.success');
      else return ctx.sendTranslate('commands.generic.settings.add.amountExceeded');
    });
  }

  async remove(ctx: Context) {
    const index = ctx.args.get(1);

    const settings = await ctx.getSettings();
    if (!settings || !settings.punishments.length) {
      return ctx.sendTranslate('commands.generic.settings.remove.noPunishments');
    }

    if (!index || !this.isInteger(index) || !this.isInRange(Number(index), 1, settings.punishments.length)) {
      return ctx.sendTranslate('commands.generic.settings.remove.invalidIndex');
    }

    const i = Math.round(Number(index)) - 1;
    settings!.punishments.splice(i, 1);
    settings!.save();
    return ctx.sendTranslate('commands.generic.settings.remove.success', { index });
  }

  async set(ctx: Context) {
    const setting = ctx.args.get(1);
    const subcommands = ['modlog', 'prefix', 'mutedrole', 'mutedRole', 'automod.swears', 'logging.channelID', 'logging.ignore', 'logging.ignoreUsers'];

    switch (setting) {
      case 'modlog': {
        const channelID = ctx.args.get(2);
        if (!channelID) {
          return ctx.sendTranslate('commands.generic.settings.noChannel');
        }

        const id = this.extractChannelId(channelID);
        console.log(channelID, id);
        if (id === null) {
          return ctx.sendTranslate('global.invalidChannel', { channel: channelID });
        }

        const channel = await this.bot.client.getRESTChannel(id);
        if (!(channel instanceof TextChannel)) {
          return ctx.sendTranslate('global.notText', { channel: channel.id });
        }

        const permissions = channel.permissionsOf(this.bot.client.user.id);
        if (!permissions.has('sendMessages') || !permissions.has('embedLinks')) {
          return ctx.sendTranslate('commands.generic.settings.set.modlog.noPerms', { channel: channel.name });
        }

        return ctx.bot.settings.update(ctx.guild!.id, {
          $set: {
            modlog: channel.id
          }
        }, (error) => {
          return error
            ? ctx.sendTranslate('commands.generic.settings.set.modlog.unable', { channel: channel.name })
            : ctx.sendTranslate('commands.generic.settings.set.modlog.success', { channel: channel.name });
        });
      }
      case 'prefix': {
        const prefix = ctx.args.slice(2).join(' ');
        const settings = await ctx.getSettings()!;

        if (!prefix) {
          return ctx.sendTranslate('commands.generic.settings.set.prefix.none');
        }

        if (prefix.length > 20) {
          // Calculate the length of the prefix
          const length = prefix.length - 20;
          return ctx.sendTranslate('commands.generic.settings.set.prefix.over20', { chars: length });
        }

        if (['@everyone', '@here'].includes(prefix)) {
          return ctx.sendTranslate('commands.generic.settings.set.prefix.atEveryone');
        }

        if (settings.prefix === prefix) {
          return ctx.sendTranslate('commands.generic.settings.set.prefix.already', { prefix });
        }

        ctx.bot.settings.update(ctx.guild!.id, {
          $set: {
            prefix
          }
        }, (error) => {
          return error
            ? ctx.sendTranslate('commands.generic.settings.set.prefix.unable', { prefix })
            : ctx.sendTranslate('commands.generic.settings.set.prefix.success', { prefix });
        });
      } break;
      case 'mutedrole':
      case 'mutedRole': {
        const mutedRole = ctx.args.get(2);
        if (!mutedRole || !/^[0-9]+$/.test(mutedRole)) {
          return !mutedRole ?
            ctx.sendTranslate('commands.generic.settings.set.mutedRole.none') :
            ctx.sendTranslate('commands.generic.settings.set.mutedRole.invalid');
        }

        const role = ctx.guild!.roles.find(role => role.id === mutedRole);
        if (!role) {
          return ctx.sendTranslate('commands.generic.settings.set.mutedRole.noneFound', { id: mutedRole });
        }

        this.bot.settings.update(ctx.guild!.id, {
          $set: {
            mutedRole: role.id
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.set.mutedRole.unable', { role: role.name })
          : ctx.sendTranslate('commands.generic.settings.set.mutedRole.success', { role: role.name }));
      } break;
      case 'automod.badwords':
      case 'automod.swears': {
        const list = ctx.args.get(2);
        if (!list) {
          return ctx.sendTranslate('commands.generic.settings.set.badwords.none');
        }

        const settings = await ctx.getSettings();
        const swears = ctx.args.slice(2);
        if (!settings!.automod.badwords.enabled) settings!.automod.badwords.enabled = true;
        settings!.automod.badwords.wordlist.push(...swears);
        await settings!.save();

        return !settings!.automod.badwords.enabled ?
          ctx.sendTranslate('commands.generic.settings.set.badwords.added.notEnabled', { words: swears.length }) :
          ctx.sendTranslate('commands.generic.settings.set.badwords.added.enabled', { words: swears.length });
      }
      case 'logging.ignore':
      case 'logging.ignored': {
        const list = ctx.args.get(2);
        if (!list) {
          return ctx.sendTranslate('commands.generic.settings.set.ignored.none');
        }

        const settings = await ctx.getSettings();
        const channels = ctx.args.slice(2);
        const errors = channels.filter(this.extractChannelId);

        if (errors.some(e => e === null)) {
          const invalid = errors
            .filter(error => error === null)
            .map(s => `**${s}**`)
            .join(', ');

          return ctx.sendTranslate('commands.generic.settings.set.ignored.invalid', { channels: invalid });
        }

        if (errors.some(e => settings!.logging.ignore.includes(e))) {
          const invalid = errors
            .filter(e => settings!.logging.ignore.includes(e))
            .map(s => `**${s}**`)
            .join(', ');

          return ctx.sendTranslate('commands.generic.settings.set.ignored.alreadyIgnored', { channels: invalid });
        }

        if (!settings!.logging.enabled) settings!.logging.enabled = true;
        settings!.logging.ignore.push(...errors);
        await settings!.save();

        return !settings!.logging.enabled ?
          ctx.sendTranslate('commands.generic.settings.set.ignored.added.notEnabled', { channels: errors.length }) :
          ctx.sendTranslate('commands.generic.settings.set.ignored.added.enabled', { channels: errors.length });
      }
      case 'logging.ignoreUsers': {
        const userID = ctx.args.get(2);
        const settings = await ctx.getSettings()!;

        if (!userID) return ctx.sendTranslate('global.noUser');
        if (userID === 'bots') {
          const bots = ctx.guild!.members.filter(m => m.user.bot).map(member => member.id);
          if (bots.some(bot => settings.logging.ignoreUsers.includes(bot))) {
            const invalid = bots
              .filter(bot => settings.logging.ignoreUsers.includes(bot))
              .map(async (bot) => {
                const user = await this.bot.client.getRESTUser(bot);
                if (!user.bot) return;

                return `${user.username}#${user.discriminator}`;
              }).slice(0, 5).join(', ');

            return ctx.sendTranslate('commands.generic.settings.set.ignoreUsers.alreadyIgnored', { members: invalid });
          }

          return this.bot.settings.update(ctx.guild!.id, {
            $push: {
              'logging.ignoreUsers': bots
            }
          }, (error) => {
            const key = error ? 'unable' : 'success';
            return ctx.sendTranslate(`commands.generic.settings.set.ignoreUsers.${key}`, { members: bots.length });
          });
        } else {
          const id = findId(userID);
          if (id === undefined) return ctx.sendTranslate('global.invalidUser', { user: userID });

          const user = await this.bot.client.getRESTUser(id);
          const settings = await ctx.getSettings()!;
          if (settings.logging.ignoreUsers.includes(user.id)) return ctx.sendTranslate('commands.generic.settings.set.ignoreUsers.alreadyIgnored', { members: [`${user.username}#${user.discriminator}`].join(', ') });

          this.bot.settings.update(ctx.guild!.id, {
            $push: {
              'logging.ignoreUsers': user.id
            }
          }, (error) => {
            const key = error ? 'unable' : 'success';
            return ctx.sendTranslate(`commands.generic.settings.set.ignoreUsers.${key}`, { members: [`${user.username}#${user.discriminator}`].join(', ') });
          });
        }
      } break;
      case 'logging.channelID': {
        const channelID = ctx.args.get(2);
        if (!channelID) {
          return ctx.sendTranslate('commands.generic.settings.noChannel');
        }

        const id = channelID.endsWith('>') ? channelID.includes('<#') ? channelID.substring(2, channelID.length - 1) : channelID : /^[0-9]+/.test(channelID) ? channelID : null;
        if (id === null) {
          return ctx.sendTranslate('global.invalidChannel', { channel: channelID });
        }

        const channel = await this.bot.client.getRESTChannel(id);
        if (channel.type !== 0) {
          return ctx.sendTranslate('global.notText', { channel: channel.id });
        }

        const permissions = channel.permissionsOf(this.bot.client.user.id);
        if (!permissions.has('sendMessages') || !permissions.has('embedLinks')) {
          return ctx.sendTranslate('commands.generic.settings.set.logChannel.noPerms', { channel: channel.name });
        }

        ctx.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.channelID': channel.id
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.set.logChannel.unable', { channel: channel.name })
          : ctx.sendTranslate('commands.generic.settings.set.logChannel.success', { channel: channel.name }));
      } break;
      default: {
        return setting === undefined
          ? ctx.sendTranslate('commands.generic.settings.noSubcommand', { subcommands: subcommands.join(', ') })
          : ctx.sendTranslate('commands.generic.settings.invalidSubcommand', {
            subcommand: setting,
            subcommands: subcommands.join(', ')
          });
      }
    }
  }

  private extractChannelId(str: string): string | null {
    if (str.startsWith('<#') && str.endsWith('>')) {
      return str.substring(2, str.length - 1);
    }
    if (/^[0-9]+$/.test(str)) {
      return str;
    }
    return null;
  }

  async enable(ctx: Context) {
    const setting = ctx.args.get(1);
    const subcommands = ['automod', 'automod.dehoist', 'automod.invites', 'automod.spam', 'automod.mention', 'automod.raid', 'automod.swears',  'automod.badwords', 'logging', 'logging.events', 'logging.events.messageDeleted', 'logging.events.messageDelete', 'logging.events.messageUpdate', 'logging.events.messageUpdated'];

    switch (setting) {
      case 'automod': {
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
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.enable.automod.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.automod.success'));
      } break;
      case 'automod.dehoist': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.dehoist': true
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.enable.dehoist.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.dehoist.success'));
      }
      case 'automod.spam': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.spam': true
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.enable.spam.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.spam.success'));
      } break;
      case 'automod.raid': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.raid': true
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.enable.raid.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.raid.success'));
      } break;
      case 'automod.mention': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.mention': true
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.enable.mention.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.mention.success'));
      } break;
      case 'automod.swears':
      case 'automod.badwords': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.badwords.enabled': true
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.enable.badwords.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.badwords.success'));
      } break;
      case 'automod.invites': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.invites': true
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.enable.invites.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.invites.success'));
      } break;
      case 'automod.invites.invalid': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.invalidInvite': true
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.enable.invalidInvite.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.invalidInvite.success'));
      } break;
      case 'logging': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.enabled': true
          }
        }, error => error
          ? ctx.sendTranslate('commands.generic.settings.enable.logging.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.logging.success'));
      } break;
      case 'logging.events': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': true,
            'logging.events.messageUpdate': true
          }
        }, error => error
          ? ctx.sendTranslate('commands.generic.settings.enable.logEvents.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.logEvents.success'));
      } break;
      case 'logging.events.messageDeleted':
      case 'logging.events.messageDelete': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': true
          }
        }, error => error
          ? ctx.sendTranslate('commands.generic.settings.enable.messageDelete.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.messageDelete.success'));
      } break;
      case 'logging.events.messageUpdated':
      case 'logging.events.messageUpdate': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageUpdate': true
          }
        }, error => error
          ? ctx.sendTranslate('commands.generic.settings.enable.messageUpdate.unable')
          : ctx.sendTranslate('commands.generic.settings.enable.messageUpdate.success'));
      } break;
      default: {
        return setting === undefined
          ? ctx.sendTranslate('commands.generic.settings.noSubcommand', { subcommands: subcommands.join(', ') })
          : ctx.sendTranslate('commands.generic.settings.invalidSubcommand', {
            subcommand: setting,
            subcommands: subcommands.join(', ')
          });
      }
    }
  }

  async disable(ctx: Context) {
    const setting = ctx.args.get(1);
    const subcommands = ['automod', 'automod.dehoist', 'automod.invites', 'automod.spam', 'automod.mention', 'automod.raid', 'automod.swears or automod.badwords', 'logging', 'logging.events.messageDelete',  'logging.events.messageDeleted', 'logging.events.messageUpdate', 'logging.events.messageUpdated'];
    switch (setting) {
      case 'automod': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.dehoist': false,
            'automod.spam': false,
            'automod.mention': false,
            'automod.raid': false,
            'automod.invites': false,
            'automod.badwords.enabled': false
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.disable.automod.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.automod.success'));
      } break;
      case 'automod.dehoist': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.dehoist': false
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.disable.dehoist.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.dehoist.success'));
      }
      case 'automod.spam': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.spam': false
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.disable.spam.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.spam.success'));
      } break;
      case 'automod.raid': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.raid': false
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.disable.raid.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.raid.success'));
      } break;
      case 'automod.mention': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.mention': false
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.disable.mention.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.mention.success'));
      } break;
      case 'automod.swears':
      case 'automod.badwords': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.badwords.enabled': false,
            'automod.badwords.wordlist': []
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.disable.badwords.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.badwords.success'));
      } break;
      case 'automod.invites': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.invites': false
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.disable.invites.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.invites.success'));
      } break;
      case 'logging': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.enabled': false
          }
        }, error => error
          ? ctx.sendTranslate('commands.generic.settings.disable.logging.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.logging.success'));
      } break;
      case 'logging.events': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': false,
            'logging.events.messageUpdate': false
          }
        }, error => error
          ? ctx.sendTranslate('commands.generic.settings.disable.logEvents.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.logEvents.success'));
      } break;
      case 'logging.events.messageDeleted':
      case 'logging.events.messageDelete': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': false
          }
        }, error => error
          ? ctx.sendTranslate('commands.generic.settings.disable.messageDelete.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.messageDelete.success'));
      } break;
      case 'logging.events.messageUpdated':
      case 'logging.events.messageUpdate': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageUpdate': false
          }
        }, error => error
          ? ctx.sendTranslate('commands.generic.settings.disable.messageUpdate.unable')
          : ctx.sendTranslate('commands.generic.settings.disable.messageUpdate.success'));
      } break;
      default: {
        return setting === undefined
          ? ctx.sendTranslate('commands.generic.settings.noSubcommand', { subcommands: subcommands.join(', ') })
          : ctx.sendTranslate('commands.generic.settings.invalidSubcommand', {
            subcommand: setting,
            subcommands: subcommands.join(', ')
          });
      }
    }
  }

  async reset(ctx: Context) {
    const subcommands = ['punishments', 'modlog', 'mutedrole', 'prefix', 'mutedRole', 'logging.ignore', 'automod.swears', 'automod.badwords'];
    const setting = ctx.args.get(1);

    switch (setting) {
      case 'punishments': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'punishments': []
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.reset.punishments.unable')
          : ctx.sendTranslate('commands.generic.settings.reset.punishments.success'));
      } break;
      case 'prefix': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'prefix': this.bot.config.discord.prefix
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.reset.prefix.unable')
          : ctx.sendTranslate('commands.generic.settings.reset.prefix.success'));
      } break;
      case 'modlog': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'modlog': null
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.reset.modlog.unable')
          : ctx.sendTranslate('commands.generic.settings.reset.modlog.success'));
      } break;
      case 'mutedrole':
      case 'mutedRole': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'mutedRole': null
          }
        }, (error) => error
          ? ctx.sendTranslate('commands.generic.settings.reset.mutedRole.unable')
          : ctx.sendTranslate('commands.generic.settings.reset.mutedRole.success'));
      } break;
      case 'logging.ignore':
      case 'logging.ignored': {
        const channel = ctx.args.get(2);
        if (!channel) return ctx.sendTranslate('commands.generic.settings.reset.ignored.none');

        const heck = [channel].filter(this.extractChannelId);
        if (heck.some(s => s === null)) return ctx.sendTranslate('commands.generic.settings.reset.ignored.invalid', { channel });

        const settings = await ctx.getSettings()!;
        if (!settings.logging.ignore.includes(channel)) return ctx.sendTranslate('commands.generic.settings.reset.ignored.alreadyIgnored', { channel });

        await this.bot.settings.update(ctx.guild!.id, {
          $pull: { 'logging.ignore': this.extractChannelId(channel)! }
        }, (error) => {
          const key = error ? 'unable' : 'success';
          return ctx.sendTranslate(`commands.generic.settings.reset.ignored.${key}`, { channel });
        });
      } break;
      case 'logging.ignoreUsers': {
        const user = ctx.args.get(2);
        if (!user) return ctx.sendTranslate('commands.generic.settings.reset.ignoreUsers.none');

        const heck = [user].filter(findId);
        if (heck.some(user => user === undefined)) return ctx.sendTranslate('commands.generic.settings.reset.ignoreUsers.invalid', { user });

        const settings = await ctx.getSettings()!;
        const u = await this.bot.client.getRESTUser(findId(user)!);
        if (!settings.logging.ignoreUsers.includes(u.id)) return ctx.sendTranslate('commands.generic.settings.reset.ignoreUsers.alreadyIgnored', { user });

        await this.bot.settings.update(ctx.guild!.id, {
          $pull: { 'logging.ignoreUsers': findId(user)! }
        }, (error) => {
          const key = error ? 'unable' : 'success';
          return ctx.sendTranslate(`commands.generic.settings.reset.ignoreUsers.${key}`, { user });
        });
      } break;
      case 'automod.swears':
      case 'automod.badwords': {
        const word = ctx.args.get(2);
        if (!word) return ctx.sendTranslate('commands.generic.settings.reset.swears.none');

        const settings = await ctx.getSettings()!;
        if (!settings.automod.badwords.enabled) return ctx.sendTranslate('commands.generic.settings.reset.swears.notEnabled');
        if (!settings.automod.badwords.wordlist.find(w => w === word)) return ctx.sendTranslate('commands.generic.settings.reset.swears.unableToFind', { word });

        await this.bot.settings.update(ctx.guild!.id, {
          $pull: { 'automod.badwords.wordlist': word }
        }, (error) => {
          const key = error ? 'unable' : 'success';
          return ctx.sendTranslate(`commands.generic.settings.reset.swears.${key}`, { word });
        });
      } break;
      default: {
        return setting === undefined
          ? ctx.sendTranslate('commands.generic.settings.noSubcommand', { subcommands: subcommands.join(', ') })
          : ctx.sendTranslate('commands.generic.settings.invalidSubcommand', {
            subcommand: setting,
            subcommands: subcommands.join(', ')
          });
      }
    }
  }

  async view(ctx: Context) {
    const settings = await ctx.getSettings()!;

    const yes = ':white_check_mark:';
    const no = ':x:';
    const events: string[] = [];

    if (settings.logging.events.messageUpdate) events.push(ctx.translate('global.events.messageUpdate'));
    if (settings.logging.events.messageDelete) events.push(ctx.translate('global.events.messageDelete'));

    const punishments = settings.punishments.length ? settings.punishments.map((value, index) =>
      ctx.translate('commands.generic.settings.view.punishment', {
        index: index + 1,
        warnings: value.warnings,
        time: value.temp ? ms(value.temp) : ctx.translate('global.none'),
        type: firstUpper(value.type),
        soft: value.soft ? ctx.translate('global.yes') : ctx.translate('global.none'),
        roleId: value.role ? `**${ctx.guild!.roles.get(value.roleid)!.name}**` : ctx.translate('global.none')
      })
    ).join('\n') : ctx.translate('global.none');

    const desc = ctx.translate('commands.generic.settings.view.message', {
      prefix: settings.prefix,
      mutedRole: ctx.guild!.roles.find(x => x.id === settings.mutedRole) ? ctx.guild!.roles.get(settings.mutedRole)!.name : 'None',
      modlog: ctx.guild!.channels.find(x => x.id === settings.modlog) ? ctx.guild!.channels.get(settings.modlog)!.id : 'None',
      logging: ctx.guild!.channels.find(x => x.id === settings.logging.channelID) ? ctx.guild!.channels.get(settings.logging.channelID)!.name : 'None',
      events: events.map(s => `- ${s}`).join('\n') || ctx.translate('global.none'),
      punishments,
      'dehoist.enabled': settings.automod.dehoist ? yes : no,
      'mention.enabled': settings.automod.mention ? yes : no,
      'invites.enabled': settings.automod.invites ? yes : no,
      'raid.enabled': settings.automod.raid ? yes : no,
      'spam.enabled': settings.automod.spam ? yes : no,
      'logging.enabled': settings.logging.enabled ? yes : no,
      'badwords.enabled': settings.automod.badwords.enabled ? yes : no,
      words: settings.automod.badwords.enabled ? ` (${settings.automod.badwords.wordlist.join(', ')})` : ' (None)'
    });

    const embed = createEmptyEmbed()
      .setTitle(ctx.translate('commands.generic.settings.view.title', { guild: ctx.guild!.name }))
      .setDescription(desc)
      .build();

    return ctx.embed(embed);
  }
}
