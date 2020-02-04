import { Constants, TextChannel } from 'eris';
import { injectable, inject } from 'inversify';
import { replaceMessage } from '../../util';
import { stripIndents } from 'common-tags';
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
      guildOnly: true,
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

    if (!warnings || !(/^[0-9]$/).test(warnings) || Number(warnings) < 1 || Number(warnings) > 5) return ctx.send('An amount of warnings is required, it also needs to between 1 and 5');
    if (!punishments.includes(punishment)) return ctx.send(`Invalid punishment: "${punishment}" (${punishments.join(' | ')})`);
  
    const temp = ctx.flags.get('time');
    if (temp && (typeof temp === 'boolean') || (typeof temp === 'string') && (!ms(temp as string) || ms(temp as string) < 1000))
      return ctx.send('The "--time" flag must be a correct time expression, it can be 0.5h, 30m, 0.5 hours, or 30 minutes');

    const soft = ctx.flags.get('soft');
    if (soft && typeof soft === 'string') return ctx.send('You appended a value to `--soft`, it should be `--soft`');

    const roleID = ctx.args.get(3);
    if (!roleID && (['unrole', 'role'].includes(punishment))) return ctx.send('You are missing a role ID to add or remove, since you wanted to add/remove a role');
    if (roleID && (typeof roleID === 'boolean') || (typeof roleID === 'string') && !((/^[0-9]+$/).test(roleID) || !ctx.guild!.roles.has(roleID)))
      return ctx.send(`Unable to find role "${roleID}" in the guild roles list`);

    const days = ctx.flags.get('days');
    if (days && (typeof days === 'boolean' || (typeof days === 'string') && !(/^[0-9]{1,2}$/).test(days)))
      return ctx.send('Incorrect amount of days. The `days` flag is the amount of days of messages to delete when banning');

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
      if (error) return ctx.send('I was unable to add the punishment');
      if (packet.n) return ctx.send('Punishment was added to the database successfully!');
      else return ctx.send('Sorry, we limited the amount of punishments per server to 15. Please remove some punishments before adding more');
    });
  }

  async remove(ctx: Context) {
    const index = ctx.args.get(1);
    if (!index || !/^[0-9]+$/.test(index) || Number(index) < 1) return ctx.send('The punishment index is required, view the index number in `x!settings view`');

    const settings = await ctx.getSettings();
    if (!settings || !settings.punishments.length) return ctx.send('You didn\'t setup any permissions');

    if (Number(index) <= settings!.punishments.length) {
      const i = Math.round(Number(index)) - 1;
      settings!.punishments.splice(i, 1);
    }

    settings!.save();
    return ctx.send(`Removed punishment #${index} from the database`);
  }

  async set(ctx: Context) {
    const setting = ctx.args.get(1);
    const subcommands = ['modlog', 'prefix', 'mutedrole', 'automod.swears', 'logging.channelID'];
    switch (setting) {
      case 'modlog': {
        const channelID = ctx.args.get(2);
        if (!channelID) return ctx.send('No channel ID was specified');

        // TODO: Use regex for this
        const id = channelID.endsWith('>') ? channelID.includes('<#') ? channelID.substring(2, channelID.length - 1) : channelID : /^[0-9]+/.test(channelID) ? channelID : null;
        if (id === null) return ctx.send(`Invalid channel ID: \`${channelID}\``);

        const channel = await this.bot.client.getRESTChannel(id);
        if (!(channel instanceof TextChannel)) return ctx.send('The mod log channel cannot be a DM, voice, category, or group channel');

        let error!: any;
        ctx.bot.settings.update(ctx.guild!.id, {
          $set: {
            modlog: channel.id
          }
        }, (error) => error = error);

        error ? ctx.send('Unable to update the mod log channel') : ctx.send(`Updated the mod log channel to **${channel.mention}**`);
      } break;
      case 'prefix': {
        const prefix = ctx.args.slice(2).join(' ');
        if (!prefix) return ctx.send('The `prefix` argument must be added');
        if (prefix.length > 20) return ctx.send(`The prefix cannot be longer then 20 characters (went ${prefix.length - 20} over!)`);
        if (['@everyone', '@here'].includes(prefix)) return ctx.send('The prefix cannot ping other members');

        ctx.bot.settings.update(ctx.guild!.id, {
          $set: {
            prefix
          }
        }, (error) => error ? ctx.send(`Unable to set the prefix to "${prefix}"`) : ctx.send(`Updated the prefix to "${prefix}" (test it out with \`${prefix}ping\`)`));
      } break;
      case 'mutedrole': {
        const mutedRole = ctx.args.get(2);
        if (!mutedRole || !/^[0-9]+$/.test(mutedRole)) return ctx.send('Invalid role ID');

        const role = ctx.guild!.roles.find(role => role.id === mutedRole);
        if (!role) return ctx.send(`Unable to find role with ID: "${mutedRole}"`);

        this.bot.settings.update(ctx.guild!.id, {
          $set: {
            mutedRole: role.id
          }
        }, (error) => error ? ctx.send(`Unable to set the muted role to "${role.name}"`) : ctx.send(`Muted role has been set to "${role.name}"`));
      } break;
      case 'automod.badwords':
      case 'automod.swears': {
        const list = ctx.args.get(2);
        if (!list) return ctx.send('No list of bad words were provided (you can multiple with ` ` after! Example: `x!settings set automod.swears bitch, fuck`');

        const settings = await ctx.getSettings();
        const swears = ctx.args.slice(2);
        if (!settings!.automod.badwords.enabled) settings!.automod.badwords.enabled = true;
        settings!.automod.badwords.wordlist.push(...swears);
        await settings!.save();

        const message = !settings!.automod.badwords.enabled ?
          `We've added ${swears.length} to the list! Since you didn't have the swearing automod feature enabled, I have enabled it for you!` :
          `Successfully added ${swears.length} new words to the list`;

        return ctx.send(message);
      }
      case 'logging.ignore': {
        const list = ctx.args.get(2);
        if (!list) return ctx.send('No list of channels were provided');

        const settings = await ctx.getSettings();
        const channels = ctx.args.slice(2);
        const errors = channels.filter(channelID =>
          channelID.endsWith('>') ? channelID.includes('<#') ? channelID.substring(2, channelID.length - 1) : channelID : /^[0-9]+/.test(channelID) ? channelID : null
        );

        if (errors.some(e => e === null)) return ctx.send(`Invalid channels: ${errors.filter(e => e === null).map(s => `\`${s}\``).join(' | ')}`);
        if (!settings!.logging.enabled) settings!.logging.enabled = true;
        settings!.logging.ignore.push(...errors);
        await settings!.save();

        const message = !settings!.logging.enabled ?
          `Added ${errors.length} channels to the ignore list, since you didn't enable the feature, I have enabled it for you.` :
          `Added ${errors.length} channels to the ignore list.`;

        return ctx.send(message);
      }
      case 'logging.channelID': {
        const channelID = ctx.args.get(2);
        if (!channelID) return ctx.send('No channel ID was specified');

        const id = channelID.endsWith('>') ? channelID.includes('<#') ? channelID.substring(2, channelID.length - 1) : channelID : /^[0-9]+/.test(channelID) ? channelID : null;
        if (id === null) return ctx.send(`Invalid channel ID: \`${channelID}\``);

        const channel = await this.bot.client.getRESTChannel(id);
        if (!(channel instanceof TextChannel)) return ctx.send('The logging channel cannot be a DM, voice, category, or group channel');

        let error!: any;
        ctx.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.channelID': channel.id
          }
        }, (error) => error = error);

        error ? ctx.send('Unable to update the logging channel') : ctx.send(`Updated the logging channel to **${channel.mention}**`);
      } break;
      default: return ctx.send(`${setting === undefined ? 'No setting was provided' : 'Invalid setting'} (${subcommands.join(' | ')})`);
    }
  }

  async enable(ctx: Context) {
    const setting = ctx.args.get(1);
    const subcommands = ['automod', 'automod.dehoist', 'automod.invites', 'automod.spam', 'automod.mention', 'automod.raid', 'automod.swears or automod.badwords', 'logging.enabled', 'logging.events', 'loggings.events.messageDeleted'];
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
        }, (error) => error ? ctx.send('Unable to enable all automod features') : ctx.send('Enabled all automod features'));
      } break;
      case 'automod.dehoist': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.dehoist': true
          }
        }, (error) => error ? ctx.send('Unable to enable the dehoisting automod feature') : ctx.send('Enabled the dehoisting automod feature'));
      } break;
      case 'automod.dehoist': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.spam': true
          }
        }, (error) => error ? ctx.send('Unable to enable the spam automod feature') : ctx.send('Enabled the spam automod feature'));
      } break;
      case 'automod.dehoist': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.raid': true
          }
        }, (error) => error ? ctx.send('Unable to enable the raid automod feature') : ctx.send('Enabled the raid automod feature'));
      } break;
      case 'automod.dehoist': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.mention': true
          }
        }, (error) => error ? ctx.send('Unable to enable the mention automod feature') : ctx.send('Enabled the mention automod feature'));
      } break;
      case 'automod.swears':
      case 'automod.badwords': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.badwords.enabled': true
          }
        }, (error) => error ? ctx.send('Unable to enable the swearing automod feature') : ctx.send('Enabled the swearing automod feature'));
      } break;
      case 'automod.invites': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.invites': true
          }
        }, (error) => error ? ctx.send('Unable to enable the invites automod feature') : ctx.send('Enabled the invites automod feature'));
      } break;
      case 'logging.enabled': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.enabled': true
          }
        }, error => error ? ctx.send('Unable to enable the logging feature') : ctx.send('Enabled the logging feature, enable some or all events with `logging.events.[name]`! (example: `logging.events`: enable all events; `logging.events.messageDeleted`: enable just the message deleted event)'));
      } break;
      case 'logging.events': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': true
          }
        }, error => error ? ctx.send('Unable to enable all events') : ctx.send('Enabled all logging events'));
      } break;
      case 'logging.events.messageDeleted':
      case 'logging.events.messageDelete': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': true
          }
        }, error => error ? ctx.send('Unable to enable the message deleted event') : ctx.send('Enabled the message deleted event')); 
      } break;
      default: return ctx.send(setting === undefined ? `No subcommand was provided. (${subcommands.join(', ')})` : `Invalid subcommand "${setting}" (${subcommands.join(', ')})`);
    }
  }

  async disable(ctx: Context) {
    const setting = ctx.args.get(1);
    const subcommands = ['automod', 'automod.dehoist', 'automod.invites', 'automod.spam', 'automod.mention', 'automod.raid', 'automod.swears or automod.badwords', 'logging.enabled', 'logging.events.messageDelete or logging.events.messageDeleted'];
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
        }, (error) => error ? ctx.send('Unable to disable all automod features') : ctx.send('Disabled all automod features'));
      } break;
      case 'automod.dehoist': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.dehoist': false
          }
        }, (error) => error ? ctx.send('Unable to disable the dehoisting automod feature') : ctx.send('Disabled the dehoisting automod feature'));
      } break;
      case 'automod.dehoist': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.spam': false
          }
        }, (error) => error ? ctx.send('Unable to disable the spam automod feature') : ctx.send('Disabled the spam automod feature'));
      } break;
      case 'automod.dehoist': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.raid': false
          }
        }, (error) => error ? ctx.send('Unable to disable the raid automod feature') : ctx.send('Disabled the raid automod feature'));
      } break;
      case 'automod.dehoist': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.mention': false
          }
        }, (error) => error ? ctx.send('Unable to disable the mention automod feature') : ctx.send('Disabled the mention automod feature'));
      } break;
      case 'automod.swears':
      case 'automod.badwords': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.badwords.enabled': false,
            'automod.badwords.wordlist': []
          }
        }, (error) => error ? ctx.send('Unable to disable the swearing automod feature') : ctx.send('Disabled the swearing automod feature'));
      } break;
      case 'automod.invites': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'automod.invites': false
          }
        }, (error) => error ? ctx.send('Unable to disable the invites automod feature') : ctx.send('Disabled the invites automod feature'));
      } break;
      case 'logging.enabled': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.enabled': false
          }
        }, error => error ? ctx.send('Unable to disable the logging feature') : ctx.send('Disabled the logging feature, enable some or all events with `logging.events.[name]`! (example: `logging.events`: enable all events; `logging.events.messageDeleted`: enable just the message deleted event)'));
      } break;
      case 'logging.events': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': false
          }
        }, error => error ? ctx.send('Unable to disable all events') : ctx.send('Disabled all logging events'));
      } break;
      case 'logging.events.messageDeleted':
      case 'logging.events.messageDelete': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'logging.events.messageDelete': false
          }
        }, error => error ? ctx.send('Unable to disable the message deleted event') : ctx.send('Disabled the message deleted event')); 
      } break;
      default: return ctx.send(setting === undefined ? `No subcommand was provided. (${subcommands.join(', ')})` : `Invalid subcommand "${setting}" (${subcommands.join(', ')})`);
    }
  }

  async reset(ctx: Context) {
    const subcommands = ['punishments', 'modlog', 'mutedrole', 'prefix'];
    const setting = ctx.args.get(1);
    switch (setting) {
      case 'punishments': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'punishments': []
          }
        }, (error) => error ? ctx.send('Unable to reset permissions') : ctx.send('Resetted all permissions'));
      } break;
      case 'prefix': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'prefix': this.bot.config.discord.prefix
          }
        }, (error) => error ? ctx.send(`Unable to reset the prefix to "${this.bot.config.discord.prefix}"`) : ctx.send(`The prefix is now \`${this.bot.config.discord.prefix}\`! Test it with \`${this.bot.config.discord.prefix}ping\``));
      } break;
      case 'modlog': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'modlog': null
          }
        }, (error) => error ? ctx.send('Resetted the mod log channel') : ctx.send('Resetted the mod log channel'));
      } break;
      case 'mutedrole': {
        await this.bot.settings.update(ctx.guild!.id, {
          $set: {
            'mutedRole': null
          }
        }, (error) => error ? ctx.send('Resetted the muted role') : ctx.send('Resetted the muted role'));
      } break;
      default: return ctx.send(setting === undefined ? `No subcommand was provided. (${subcommands.join(', ')})` : `Invalid subcommand "${setting}" (${subcommands.join(', ')})`);
    }
  }

  async view(ctx: Context, provided: boolean = false) {
    const settings = await ctx.getSettings();
    const embed = this.bot.getEmbed()
      .setTitle(`Configuration for ${ctx.guild!.name}`)
      .setDescription(stripIndents`
        \`\`\`ini
        [prefix]: ${settings!.prefix}
        [mutedrole]: ${settings!.mutedRole ? ctx.guild!.roles.get(settings!.mutedRole)!.name : 'None'} 
        [modlog]: ${settings!.modlog ? ctx.guild!.channels.get(settings!.modlog)!.name : 'None'}
        [automod.dehoist]: ${settings!.automod.dehoist ? 'Enabled' : 'Disabled'}
        [automod.mention]: ${settings!.automod.mention ? 'Enabled' : 'Disabled'}
        [automod.invites]: ${settings!.automod.invites ? 'Enabled' : 'Disabled'}
        [automod.raid]: ${settings!.automod.raid ? 'Enabled' : 'Disabled'}
        [automod.spam]: ${settings!.automod.spam ? 'Enabled' : 'Disabled'}
        [automod.swears]: ${settings!.automod.badwords.wordlist.length ? settings!.automod.badwords.wordlist.join(', ') : settings!.automod.badwords.enabled ? 'Enabled (without any words)' : 'Disabled'}
        [punishments]: 
        ${settings!.punishments.map((p, i) => `${i + 1}: ${p.type} with ${p.warnings} warnings${p.temp ? `, with time ${ms(p.temp)}` : p.soft ? ', soft' : p.roleid ? `, with role ${ctx.guild!.roles.get(p.roleid)}` : ''}`).join('\n')}
        \`\`\`
      `);

    if (!provided) embed.setFooter('You\'re viewing this because you provided an invalid or no subcommand', this.bot.client.users.get(ctx.guild!.ownerID)!.avatarURL);
    return ctx.embed(embed.build());
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
