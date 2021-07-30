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

import { EmbedBuilder, CommandMessage } from '../structures';
import type { Message, TextChannel } from 'eris';
import { Service, Inject } from '@augu/lilith';
import LocalizationService from './LocalizationService';
import type NinoCommand from '../structures/Command';
import AutomodService from './AutomodService';
import { Collection } from '@augu/collections';
import Subcommand from '../structures/Subcommand';
import Prometheus from '../components/Prometheus';
import { Logger } from 'tslog';
import Database from '../components/Database';
import { join } from 'path';
import Discord from '../components/Discord';
import Config from '../components/Config';
import Sentry from '../components/Sentry';

const FLAG_REGEX = /(?:--?|—)([\w]+)(=?(\w+|['"].*['"]))?/gi;

@Service({
  priority: 1,
  children: join(process.cwd(), 'commands'),
  name: 'commands',
})
export default class CommandService extends Collection<string, NinoCommand> {
  public commandsExecuted: number = 0;
  public messagesSeen: number = 0;
  public cooldowns: Collection<string, Collection<string, number>> =
  new Collection();

  @Inject
  private readonly config!: Config;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly database!: Database;

  @Inject
  private readonly prometheus!: Prometheus;

  @Inject
  private readonly automod!: AutomodService;

  @Inject
  private readonly localization!: LocalizationService;

  @Inject
  private readonly sentry?: Sentry;

  onChildLoad(command: NinoCommand) {
    if (!command.name) {
      this.logger.warn(`Unfinished command: ${command.constructor.name}`);
      return;
    }

    this.logger.info(`✔ Loaded command ${command.name}!`);
    this.set(command.name, command);
  }

  async handleCommand(msg: Message<TextChannel>) {
    this.prometheus.messagesSeen?.inc();
    this.messagesSeen++;

    if ((await this.automod.run('message', msg)) === true) return;

    if (msg.author.bot) return;
    if (![0, 5].includes(msg.channel.type)) return;

    const settings = await this.database.guilds.get(msg.channel.guild.id);
    const userSettings = await this.database.users.get(msg.author.id);

    const _prefixes = ([] as string[])
      .concat(
        settings.prefixes,
        userSettings.prefixes,
        this.config.getProperty('prefixes')!
      )
      .filter(Boolean);

    const mentionRegex =
      this.discord.mentionRegex ??
      new RegExp(`<@!?${this.discord.client.user.id}> `);
    const mention = mentionRegex.exec(msg.content);
    if (mention !== null) _prefixes.push(`${mention}`);

    // remove duplicates
    if (this.discord.client.user.id === '531613242473054229')
      _prefixes.push('nino ');

    // Removes any duplicates
    const prefixes = [...new Set(_prefixes)];
    const prefix = prefixes.find((prefix) => msg.content.startsWith(prefix));
    if (prefix === undefined) return;

    let rawArgs = msg.content.slice(prefix.length).trim().split(/ +/g);
    const name = rawArgs.shift()!;
    const command = this.find(
      (command) => command.name === name || command.aliases.includes(name)
    );

    if (command === null) return;

    // Check for if the guild is blacklisted
    const guildBlacklist = await this.database.blacklists.get(msg.guildID);
    if (guildBlacklist !== undefined) {
      const issuer = this.discord.client.users.get(guildBlacklist.issuer);
      await msg.channel.createMessage(
        [
          `:pencil2: **This guild is blacklisted by ${
            issuer?.username ?? 'Unknown User'
          }#${issuer?.discriminator ?? '0000'}**`,
          `> ${guildBlacklist.reason ?? '*(no reason provided)*'}`,
          '',
          'If there is a issue or want to be unblacklisted, reach out to the developers here: discord.gg/ATmjFH9kMH in under #support.',
          'I will attempt to leave this guild, goodbye. :wave:',
        ].join('\n')
      );

      await msg.channel.guild.leave();
      return;
    }

    // Check if the user is blacklisted
    const userBlacklist = await this.database.blacklists.get(msg.author.id);
    if (userBlacklist !== undefined) {
      const issuer = this.discord.client.users.get(userBlacklist.issuer);
      return msg.channel.createMessage(
        [
          `:pencil2: **You were blacklisted by ${
            issuer?.username ?? 'Unknown User'
          }#${issuer?.discriminator ?? '0000'}**`,
          `> ${userBlacklist.reason ?? '*(no reason provided)*'}`,
          '',
          'If there is a issue or want to be unblacklisted, reach out to the developers here: discord.gg/ATmjFH9kMH in under #support.',
        ].join('\n')
      );
    }

    const locale = this.localization.get(
      settings.language,
      userSettings.language
    );
    const message = new CommandMessage(msg, locale, settings, userSettings);
    app.addInjections(message);

    const owners = this.config.getProperty('owners') ?? [];
    if (command.ownerOnly && !owners.includes(msg.author.id))
      return message.reply(
        `Command **${command.name}** is a developer-only command, nice try...`
      );

    // Check for permissions of Nino
    if (command.botPermissions.length) {
      const permissions = msg.channel.permissionsOf(
        this.discord.client.user.id
      );
      const missing = command.botPermissions.filter(
        (perm) => !permissions.has(perm)
      );

      if (missing.length > 0)
        return message.reply(
          `I am missing the following permissions: **${missing.join(', ')}**`
        );
    }

    // Check for the user's permissions
    if (command.userPermissions.length) {
      const permissions = msg.channel.permissionsOf(msg.author.id);
      const missing = command.userPermissions.filter(
        (perm) => !permissions.has(perm)
      );

      if (missing.length > 0 && !owners.includes(msg.author.id))
        return message.reply(
          `You are missing the following permission: **${missing.join(', ')}**`
        );
    }

    // Cooldowns
    if (!this.cooldowns.has(command.name))
      this.cooldowns.set(command.name, new Collection());

    const now = Date.now();
    const timestamps = this.cooldowns.get(command.name)!;
    const amount = command.cooldown * 1000;

    if (!owners.includes(msg.author.id) && timestamps.has(msg.author.id)) {
      const time = timestamps.get(msg.author.id)! + amount;
      if (now < time) {
        const left = (time - now) / 1000;
        return message.reply(
          `Please wait **${left.toFixed()}** seconds before executing this command.`
        );
      }
    }

    timestamps.set(msg.author.id, now);
    setTimeout(() => timestamps.delete(msg.author.id), amount);

    // Figure out the subcommand
    let methodName = 'run';
    let subcommand: Subcommand | undefined = undefined;
    for (const arg of rawArgs) {
      if (command.subcommands.length > 0) {
        if (
          command.subcommands.find((r) => r.aliases.includes(arg)) !== undefined
        ) {
          subcommand = command.subcommands.find((r) =>
            r.aliases.includes(arg)
          )!;
          methodName = subcommand.name;
          break;
        }

        if (command.subcommands.find((r) => r.name === arg) !== undefined) {
          subcommand = command.subcommands.find((r) => r.name === arg)!;
          methodName = subcommand.name;
          break;
        }
      }
    }

    if (subcommand !== undefined) rawArgs.shift();

    message['_flags'] = this.parseFlags(rawArgs.join(' '));
    if (command.name !== 'eval') {
      rawArgs = rawArgs.filter((arg) => !FLAG_REGEX.test(arg));
    }

    try {
      const executor = Reflect.get(command, methodName);
      if (typeof executor !== 'function')
        throw new SyntaxError(
          `${subcommand ? 'Subc' : 'C'}ommand "${
            subcommand ? methodName : command.name
          }" was not a function.`
        );

      this.prometheus.commandsExecuted?.labels(command.name).inc();
      this.commandsExecuted++;
      await executor.call(command, message, rawArgs);
      this.logger.info(
        `Command "${command.name}" has been ran by ${msg.author.username}#${msg.author.discriminator} in guild ${msg.channel.guild.name} (${msg.channel.guild.id})`
      );
    } catch (ex) {
      const _owners = await Promise.all(
        owners.map((id) => {
          const user = this.discord.client.users.get(id);
          if (user === undefined) return this.discord.client.getRESTUser(id);
          else return Promise.resolve(user);
        })
      );

      const contact = _owners
        .map(
          (r, index) =>
            `${index + 1 === owners.length ? 'or ' : ''}**${r.username}#${
              r.discriminator
            }**`
        )
        .join(', ');

      const embed = new EmbedBuilder()
        .setColor(0xdaa2c6)
        .setDescription([
          `${
            subcommand !== undefined
              ? `Subcommand **${methodName}** (parent **${command.name}**)`
              : `Command **${command.name}**`
          } has failed to execute.`,
          `If this is a re-occuring issue, contact ${contact} at <https://discord.gg/ATmjFH9kMH>, under the <#747522228714733610> channel.`,
          '',
          '```js',
          ex.stack ?? '<... no stacktrace? ...>',
          '```',
        ])
        .build();

      await msg.channel.createMessage({ embed });
      this.logger.error(
        `${
          subcommand !== undefined
            ? `Subcommand ${methodName}`
            : `Command ${command.name}`
        } has failed to execute:`
      );
      this.logger.error(ex);

      this.sentry?.report(ex);
    }
  }

  // credit for regex: Ice <3
  private parseFlags(content: string): Record<string, string | true> {
    const record: Record<string, string | true> = {};
    content.replaceAll(FLAG_REGEX, (_, key: string, value: string) => {
      record[key.trim()] = value
        ? value.replaceAll(/(^[='"]+|['"]+$)/g, '').trim()
        : true;
      return value;
    });

    // keep it immutable so
    // the application doesn't mutate its state
    return Object.freeze(record);
  }
}
