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

import { Command, Subcommand, CommandMessage, EmbedBuilder } from '../../structures';
import { Categories, Color } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Config from '../../components/Config';

interface Flags {
  user?: string | true;
  u?: string | true;
}

export default class PrefixCommand extends Command {
  @Inject
  private database!: Database;

  @Inject
  private config!: Config;

  constructor() {
    super({
      description: 'descriptions.prefix',
      category: Categories.Settings,
      examples: [
        'prefix',
        'prefix set !',
        'prefix set ! --user',
        'prefix remove !',
        'prefix remove ! --user',
        'prefix remove 1',
        'prefix remove 1 --user'
      ],
      aliases: ['prefixes'],
      usage: '[prefix] [--user]',
      name: 'prefix'
    });
  }

  async run(msg: CommandMessage) {
    const flags = msg.flags<Flags>();
    const entity = flags.user === true || flags.u === true ? msg.userSettings : msg.settings;
    const defaultPrefixes = this.config.getProperty('prefixes') ?? [];

    const embed = new EmbedBuilder()
      .setColor(Color)
      .setDescription([
        `> **List of ${flags.user === true || flags.u === true ? 'user' : 'guild'} prefixes available**:`,
        '',
        '```apache',
        entity.prefixes.map((prefix, index) => `- ${index}. : ${prefix}`).join('\n') || `None (use ${msg.settings.prefixes[0]}prefix set <prefix> -u to set one!)`,
        '```'
      ]);

    if (defaultPrefixes.length > 0)
      embed.setFooter(`Prefixes ${defaultPrefixes.join(', ')} will always work no matter what.`);

    return msg.reply(embed);
  }

  @Subcommand('<prefix> [--user | -u]')
  async set(msg: CommandMessage, [...prefix]: [...string[]]) {
    if (!prefix)
      return msg.reply('Missing a prefix to set! You can use `"` to make spaced ones, example: `"nino "` -> `nino `.');

    const pre = prefix.join(' ').replaceAll(/['"]/g, '');
    if (pre.length > 25)
      return msg.reply(`Prefix \`${pre}\` is over the limit of 25 characters, you went over ${pre.length - 25} characters (excluding \`"\`).`);

    const flags = msg.flags<Flags>();
    const isUser = flags.user === true || flags.u === true;
    const controller = isUser ? this.database.users : this.database.guilds;
    const data = await controller.get(isUser ? msg.author.id : msg.guild.id);
    const owners = this.config.getProperty('owners') ?? [];

    if (!isUser && (!msg.member.permissions.has('manageGuild') || !owners.includes(msg.author.id)))
      return msg.reply('Missing the **Manage Guild** permission.');

    if (data.prefixes.length > 5)
      return msg.reply(`${isUser ? 'You' : 'The guild'} has exceeded the amount of prefixes.`);

    const index = data.prefixes.findIndex(prefix => prefix.toLowerCase() === pre.toLowerCase());
    if (index !== -1)
      return msg.reply(`Prefix \`${pre}\` already exists as a ${isUser ? 'your' : 'the guild\'s'} prefix.`);

    data.prefixes.push(pre);

    // @ts-ignore Wow, our first ts-ignore in this project! (ts2349)
    await controller.repository.save(data);
    return msg.reply(`Prefix \`${pre}\` is now available`);
  }

  @Subcommand('<index> [--user | -u]')
  async reset(msg: CommandMessage, [...prefix]: [...string[]]) {
    if (!prefix)
      return msg.reply('Missing a prefix to set! You can use `"` to make spaced ones, example: `"nino "` -> `nino `.');

    const pre = prefix.join(' ').replaceAll(/['"]/g, '');
    if (pre.length > 25)
      return msg.reply(`Prefix \`${pre}\` is over the limit of 25 characters, you went over ${pre.length - 25} characters (excluding \`"\`).`);

    const flags = msg.flags<Flags>();
    const isUser = flags.user === true || flags.u === true;
    const controller = isUser ? this.database.users : this.database.guilds;
    const data = await controller.get(isUser ? msg.author.id : msg.guild.id);
    const owners = this.config.getProperty('owners') ?? [];

    if (!isUser && (!msg.member.permissions.has('manageGuild') || !owners.includes(msg.author.id)))
      return msg.reply('Missing the **Manage Guild** permission.');

    const index = data.prefixes.findIndex(prefix => prefix.toLowerCase() === pre.toLowerCase());
    if (index === -1)
      return msg.reply('Prefix was not found');

    data.prefixes.splice(index, 1);

    // @ts-ignore Check out the issue ID -> (ts2349)
    await controller.repository.save(data);
    return msg.reply(`Prefix with index **${index}** (\`${prefix}\`) has been removed, ${isUser ? 'you' : 'the guild'} have ${data.prefixes.length} prefix${data.prefixes.length === 1 ? 'es' : ''} left.`);
  }
}
