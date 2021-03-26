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

import type { Message, OldMessage, TextChannel } from 'eris';
import { Command, EmbedBuilder } from '..';
import { NotInjectable, Inject } from '@augu/lilith';
import type CommandService from '../../services/CommandService';
import { Collection } from '@augu/collections';
import CommandMessage from '../CommandMessage';
import Subcommand from '../Subcommand';
import { Logger } from 'tslog';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import Config from '../../components/Config';

// hacky solution for:
// "Property 'x' does not exist on type 'TextChannel | { id: string }'."
export interface ErisMessage extends Message<TextChannel> {
  channel: TextChannel;
}

@NotInjectable()
export default class CommandHandler {
  constructor(private service: CommandService) {}

  @Inject
  private database!: Database;

  @Inject
  private config!: Config;

  @Inject
  private logger!: Logger;

  @Inject
  private discord!: Discord;

  async onMessageEdit(msg: ErisMessage, old: OldMessage | null) {
    if (old === null)
      return;

    if (old.content !== msg.content)
      return this.handleCommand(msg);
  }

  async handleCommand(msg: ErisMessage) {
    this.service.messagesSeen++;

    if (msg.author.bot) return;
    if (![0, 5].includes(msg.channel.type)) return;

    const settings = await this.database.guilds.get(msg.channel.guild.id);
    const userSettings = await this.database.users.get(msg.author.id);

    // remove duplicates
    const prefixes = [...new Set([`${this.discord.mentionRegex}`].concat(settings.prefixes, userSettings.prefixes, this.config.getProperty('prefixes')!).filter(Boolean))];
    if (this.discord.client.user.id === '531613242473054229')
      prefixes.push('nino ');

    const prefix = prefixes.find(prefix => msg.content.startsWith(prefix));
    if (prefix === undefined)
      return;

    const rawArgs = msg.content.slice(prefix.length).trim().split(/ +/g);
    const name = rawArgs.shift()!;
    const command = this.service.commands.find(command =>
      command.name === name || command.aliases.includes(name)
    );

    if (command === null)
      return;

    const message = new CommandMessage(msg, settings, userSettings);
    const owners = this.config.getProperty('owners') ?? [];
    if (command.ownerOnly && !owners.includes(msg.author.id))
      return message.reply(`Command **${command.name}** is a developer-only command, nice try...`);

    // Check for permissions of Nino
    if (command.botPermissions.length) {
      const permissions = msg.channel.permissionsOf(this.discord.client.user.id);
      const missing = command.botPermissions.filter(perm => !permissions.has(perm));

      if (missing.length > 0)
        return message.reply(`I am missing the following permissions: **${missing.join(', ')}**`);
    }

    // Check for the user's permissions
    if (command.userPermissions.length) {
      const permissions = msg.channel.permissionsOf(msg.author.id);
      const missing = command.userPermissions.filter(perm => !permissions.has(perm));

      if (missing.length > 0)
        return message.reply(`You are missing the following permission: **${missing.join(', ')}**`);
    }

    // Cooldowns
    if (!this.service.cooldowns.has(command.name))
      this.service.cooldowns.set(command.name, new Collection());

    const now = Date.now();
    const timestamps = this.service.cooldowns.get(command.name)!;
    const amount = command.cooldown * 1000;

    if (timestamps.has(msg.author.id)) {
      const time = timestamps.get(msg.author.id)! + amount;
      if (now < time) {
        const left = (time - now) / 1000;
        return message.reply(`Please wait **${left.toFixed()}** seconds before executing this command.`);
      }
    }

    timestamps.set(msg.author.id, now);
    setTimeout(() => timestamps.delete(msg.author.id), amount);

    // Figure out the subcommand
    let methodName = 'run';
    let subcommand: Subcommand | undefined = undefined;
    for (const arg of rawArgs) {
      if (command.subcommands.length && command.subcommands.find(r => r.name === arg) !== undefined) {
        subcommand = command.subcommands.find(r => r.name === arg)!;
        methodName = subcommand.name;

        break;
      }
    }

    if (subcommand !== undefined)
      rawArgs.shift();

    const [args, error] = await this.parseArgs(message, subcommand ?? command, rawArgs);
    if (error !== undefined)
      return message.reply(error);

    message['_flags'] = this.parseFlags(rawArgs.join(' '));
    try {
      const executor = Reflect.get(command, methodName);
      if (typeof executor !== 'function')
        throw new SyntaxError(`${subcommand ? 'Subc' : 'C'}ommand "${subcommand ? methodName : command.name}" was not a function.`);

      await executor.call(command, message, args);
      this.logger.info(`Command "${command.name}" has been ran by ${msg.author.username}#${msg.author.discriminator} in guild ${msg.channel.guild.name} (${msg.channel.guild.id})`);
    } catch(ex) {
      const _owners = await Promise.all(owners.map(id => {
        const user = this.discord.client.users.get(id);
        if (user === undefined)
          return this.discord.client.getRESTUser(id);
        else
          return Promise.resolve(user);
      }));

      const contact = _owners
        .map((r, index) => `${index + 1 === owners.length ? 'or ' : ''}**${r.username}#${r.discriminator}**`)
        .join(', ');

      const embed = new EmbedBuilder()
        .setColor(0xDAA2C6)
        .setDescription([
          `${subcommand !== undefined ? `Subcommand **${methodName}**` : `Command **${command.name}**`} has failed to execute.`,
          `If this is a re-occuring issue, contact ${contact} at <https://discord.gg/JjHGR6vhcG>, under the <#747522228714733610> channel.`,
          '',
          '```js',
          ex.stack ?? '<... no stacktrace? ...>',
          '```'
        ])
        .build();

      await msg.channel.createMessage({ embed });

      // hacky way for "TypeError  Cannot set property name of  which has only a getter"
      this.logger.error(`${subcommand !== undefined ? `Subcommand ${methodName}` : `Command ${command.name}`} has failed to execute`);
      console.error(ex.stack);
    }
  }

  private async parseArgs(message: CommandMessage, command: Command | Subcommand, rawArgs: string[]): Promise<[list: any, error?: string]> {
    if (!command.args.length || !rawArgs.length)
      return [{}];

    // hopefully this is good?
    if (!rawArgs.length && command.args.some(r => r.info.default !== null))
      return [command.args.reduce<any>((prev, curr) => (prev[curr.info.name] = curr.info.default, prev), {})];
    else if (!rawArgs.length && command.args.every(r => r.info.default === null))
      return [{}];

    const isSub = command instanceof Subcommand;
    const list: any = {};

    if (rawArgs.length > command.args.length && command.args[command.args.length - 1].info.rest === false)
      return [list, `You have provided too many arguments! Review the ${isSub ? 'subcommand': 'command'}'s usage: \`help ${command.name}\``];

    for (let i = 0; i < command.args.length; i++) {
      const arg = command.args[i];
      const result = await arg.resolve(message, arg.info.rest === true ? rawArgs.slice(i).join(' ') : rawArgs[i]);

      if (result.error)
        return [list, result.error];

      list[arg.info.name] = result.value;
    }

    return [list];
  }

  // credit for regex: Ice <3
  private parseFlags(content: string): Record<string, string | true> {
    const record: Record<string, string | true> = {};
    content.replaceAll(/(?:--?|—)([\w]+)(=?(\w+|['"].*['"]))?/gi, (_, key: string, value: string) => {
      record[key.trim()] = value ? value.replaceAll(/(^[='"]+|['"]+$)/g, '').trim() : true;
      return value;
    });

    // keep it immutable so
    // the application doesn't mutate its state
    return Object.freeze(record);
  }
}
