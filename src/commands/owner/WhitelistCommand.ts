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

import { Command, CommandMessage } from '../../structures';
import { Categories } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Config from '../../components/Config';

export default class WhitelistCommand extends Command {
  @Inject
  private database!: Database;

  @Inject
  private config!: Config;

  constructor() {
    super({
      description: 'Whitelists a user or guild from Nino',
      category: Categories.Owner,
      ownerOnly: true,
      hidden: true,
      aliases: ['wl'],
      usage: '["guild" | "user"] [id] [...reason]',
      name: 'whitelist',
    });
  }

  async run(msg: CommandMessage, [type, id]: ['guild' | 'user', string]) {
    if (!['guild', 'user'].includes(type))
      return msg.reply('Missing the type to blacklist. Available options: `user` and `guild`.');

    if (type === 'guild') {
      const entry = await this.database.blacklists.get(id);
      if (entry === undefined) return msg.reply(`Guild **${id}** is already whitelisted`);

      await this.database.blacklists.delete(id);
      return msg.reply(`:thumbsup: Whitelisted guild **${id}**.`);
    }

    if (type === 'user') {
      const owners = this.config.getProperty('owners') ?? [];
      if (owners.includes(id)) return msg.reply('Cannot whitelist a owner');

      const entry = await this.database.blacklists.get(id);
      if (entry === undefined) return msg.reply(`User **${id}** is already whitelisted`);

      await this.database.blacklists.delete(id);
      return msg.reply(`:thumbsup: Whitelisted user ${id}.`);
    }
  }
}
