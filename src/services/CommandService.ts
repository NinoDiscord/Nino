/**
 * Copyright (c) 2019-2021 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Service, Inject, getInjectables } from '@augu/lilith';
import type { Message, TextChannel } from 'eris';
import type ArgumentResolver from '../structures/arguments/ArgumentResolver';
import { readdirSync, Ctor } from '@augu/utils';
import type NinoCommand from '../structures/Command';
import CommandMessage from '../structures/CommandMessage';
import { Collection } from '@augu/collections';
import EmbedBuilder from '../structures/EmbedBuilder';
import Restriction from '../structures/Restriction';
import GuildEntity from '../entities/GuildEntity';
import UserEntity from '../entities/UserEntity';
import { Logger } from 'tslog';
import Database from '../components/Database';
import { join } from 'path';
import Discord from '../components/Discord';
import Config from '../components/Config';
import app from '../container';

// resolvers
import StringResolver from '../structures/resolvers/StringResolver';
import IntResolver from '../structures/resolvers/IntegerResolver';

// restrictions
import GuildOnlyRestriction from '../structures/restrictions/GuildOnlyRestriction';
import OwnerOnlyRestriction from '../structures/restrictions/OwnerOnlyRestriction';

export default class CommandService implements Service {
  public commandsExecuted: number = 0;
  private restrictions: Collection<string, Restriction> = new Collection();
  public messagesSeen: number = 0;
  private resolvers: Collection<string, ArgumentResolver<any>> = new Collection();
  public cooldowns: Collection<string, Collection<string, number>> = new Collection();
  public commands: Collection<string, NinoCommand> = new Collection();
  public name = 'Commands';

  @Inject
  private config!: Config;

  @Inject
  private database!: Database;

  @Inject
  private logger!: Logger;

  @Inject
  private discord!: Discord;

  async load() {
    // Add in resolvers
    this._addResolvers();

    // Add in restrictions
    this._addRestrictions();

    // Add in the message create event
    this.discord.client.on('messageCreate', this.handleCommand.bind(this));

    // Load in commands
    this.logger.info('Now loading in commands...');
    const files = readdirSync(join(__dirname, '..', 'commands'));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ctor: Ctor<any> = await import(file);
      const command: NinoCommand = new ctor.default!();

      // only the help command will have the `commands` prop to be this
      const injections = getInjectables(command);
      app.inject(injections.filter(inject => inject.property !== 'commands'), command);

      // if it's the help command, let's inject it
      const injection = injections.filter(inject => inject.property === 'commands')[0];
      if (injection !== undefined)
        app.inject([
          {
            property: 'commands',
            ref: CommandService
          }
        ], command);

      // Arguments needs the resolvers, so this instance needs to be populated
      command.args.forEach(arg => {
        arg.service = this;
      });

      this.commands.set(command.name, command);
      this.logger.info(`Initialized command ${command.name}`);
    }

    this.logger.info(`Loaded ${this.commands.size} commands!`);
  }

  getArgumentResolver(type: string) {
    return this.resolvers.get('string')!;
  }

  private _addResolvers() {
    this.resolvers.set('string', new StringResolver());
    this.resolvers.set('int', new IntResolver());
  }

  private _addRestrictions() {
    const guildOnly = new GuildOnlyRestriction();
    const ownerOnly = new OwnerOnlyRestriction();

    const ownerOnlyInjects = getInjectables(ownerOnly);
    app.inject(ownerOnlyInjects, ownerOnly);

    this.restrictions.set('guild', guildOnly);
    this.restrictions.set('owner', ownerOnly);
  }

  private async handleCommand(msg: Message<TextChannel>) {
    this.messagesSeen++;
    if (msg.author.bot) return;

    if (![0, 5].includes(msg.channel.type))
      return msg.channel.createMessage(`[ <:xmark:464708589123141634> **~** ${msg.author.username}#${msg.author.discriminator} ]\nCommands cannot be ran in a non-textable channel, please run a command in a guild.`);

    const guildSettings = await this.database.guilds.get(msg.channel.guild.id);
    let userSettings = await this.database.users.findOne({ id: msg.author.id });

    if (!userSettings) {
      const entry = new UserEntity();
      entry.prefixes = [];
      entry.language = 'en_US';
      entry.id = msg.author.id;

      await this.database.users.save(entry);
      userSettings = entry;
    }

    const prefixes = [`${this.discord.mentionRegex}`]
      .concat(guildSettings.prefixes, userSettings!.prefixes, this.config.getProperty('prefixes')!)
      .filter(Boolean);

    if (this.discord.client.user.id === '531613242473054229')
      prefixes.push('nino ');

    if ((new RegExp(`^<@!?${this.discord.client.user.id}>$`)).test(msg.content)) {
      const embed = new EmbedBuilder()
        .setColor(0xDAA2C6)
        .setDescription([
          `Hi! I am **${this.discord.client.user.username}**! I am a moderation bot helping this guild!`,
          'If you want to learn more about me, visit <https://nino.floofy.dev> for more information!'
        ]).build();

      return msg.channel.createMessage({
        content: `**[** :wave: **~** ${msg.author.username}#${msg.author.discriminator} **]**`,
        embed
      });
    }

    const prefix = prefixes.find(prefix => msg.content.startsWith(prefix));
    if (prefix === undefined)
      return;

    const rawArgs = msg.content.slice(prefix.length).trim().split(/ +/g);
    const name = rawArgs.shift()!;
    const command = this.commands.find(command =>
      command.name === name || command.aliases.includes(name)
    );

    if (command === null)
      return;

    const message = new CommandMessage(msg, command);
    for (let i = 0; i < command.restrictions.length; i++) {
      const name = command.restrictions[i];
      const restriction = this.restrictions.get(name)!;

      if (!restriction.run(message))
        return msg.channel.createMessage(`**[** <:xmark:464708589123141634> **~** ${msg.author.username}#${msg.author.discriminator} **]**\n\n> Restriction **${name}** has failed.`);
    }

    if (!this.cooldowns.has(command.name))
      this.cooldowns.set(command.name, new Collection());

    const now = Date.now();
    const timestamps = this.cooldowns.get(command.name)!;
    const amount = command.cooldown * 1000;

    if (timestamps.has(msg.author.id)) {
      const time = timestamps.get(msg.author.id)! + amount;
      if (now < time) {
        const left = (time - now) / 1000;
        return msg.channel.createMessage(`**[** <:xmark:464708589123141634> **~** ${msg.author.username}#${msg.author.discriminator} **]**\n\n> Please wait **${left.toFixed()}** seconds before executing this command.`);
      }
    }

    timestamps.set(msg.author.id, now);
    setTimeout(() => timestamps.delete(msg.author.id), amount);

    let methodName = 'run';
    let isSub = false;
    for (const arg of rawArgs) {
      if (command.subcommands.length && command.subcommands.find(r => r.name === arg) !== undefined) {
        const subcommand = command.subcommands.find(r => r.name === arg)!;
        methodName = subcommand.name;
        isSub = true;

        break;
      }
    }

    const args: { [x: string]: any } | string = await (async () => {
      if (!command.args.length) return {};

      const list: { [x: string]: any } = {};
      const required = command.args.reduce((prev, curr) => prev + (curr.info.optional ? 0 : 1), 0);

      if (rawArgs.length < required)
        return `**[** <:xmark:464708589123141634> **~** ${msg.author.username}#${msg.author.discriminator} **]**\n\n> Provided too little arguments. Review the command usage with \`${prefix}help ${command.name}\``;

      if (rawArgs.length > required && !command.args[command.args.length - 1].info.rest)
        return `**[** <:xmark:464708589123141634> **~** ${msg.author.username}#${msg.author.discriminator} **]**\n\n> Provided too many arguments. Review the command usage with \`${prefix}help ${command.name}\``;

      for (let i = 0; i < command.args.length; i++) {
        const arg = command.args[i];
        const possible = arg.info.rest === true ? rawArgs.slice(i).join(' ') : rawArgs[i];

        try {
          const error = await arg.resolver.validate(message, possible, arg);
          if (typeof error === 'string')
            return `**[** <:xmark:464708589123141634> **~** ${msg.author.username}#${msg.author.discriminator} **]**\n\n> Argument \`${arg.info.name}\` has failed to be validated: **${error}**`;
        } catch(ex) {
          return `**[** <:xmark:464708589123141634> **~** ${msg.author.username}#${msg.author.discriminator} **]**\n\n> Argument \`${arg.info.name}\` has failed to be validated: **${ex.message}**`;
        }

        list[arg.info.name] = arg.resolver.parse(message, possible, arg);
      }

      message['_cmdArgs'] = list;
      return list;
    })();

    if (typeof args === 'string')
      return msg.channel.createMessage(args);

    try {
      if (isSub)
        rawArgs.shift();

      const executor = Reflect.get(command, methodName);
      if (typeof executor !== 'function')
        throw new SyntaxError(`${isSub ? 'Subc' : 'C'}ommand "${isSub ? methodName : command.name}" was not a function.`);

      await executor.call(command, message);
      this.logger.info(`Command "${command.name}" has been ran by ${msg.author.username}#${msg.author.discriminator} in guild ${msg.channel.guild.name} (${msg.channel.guild.id})`);
    } catch(ex) {
      const embed = new EmbedBuilder()
        .setColor(0xDAA2C6)
        .setDescription([
          `${isSub ? `Subcommand **${methodName}**` : `Command **${command.name}**`} has failed to execute.`,
          'If this issue keeps re-occuring, report it at <https://discord.gg/JjHGR6vhcG>.',
          '',
          '```js',
          ex.stack ?? '<... no stacktrace? ...>',
          '```'
        ]).build();

      msg.channel.createMessage({ embed });
      this.logger.fatal(`${isSub ? `Subcommand "${methodName}"` : `Command "${command.name}"`} has failed to execute`, ex);
    }
  }
}
