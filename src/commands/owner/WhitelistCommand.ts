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
import { BlacklistType } from '../../entities/BlacklistEntity';
import { Categories } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Discord from '../../components/Discord';

export default class WhitelistCommand extends Command {
  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  constructor() {
    super({
      description: 'Whitelists a user or guild from Nino',
      category: Categories.Owner,
      ownerOnly: true,
      aliases: ['wl'],
      usage: '["guild" | "user"] [id] [...reason]',
      name: 'whitelist'
    });
  }

  async run(msg: CommandMessage, [type, id, ...reason]: ['guild' | 'user', string, ...string[]]) {
    if (!['guild', 'user'].includes(type))
      return msg.reply('Missing the type to blacklist. Available options: `user` and `guild`.');

    if (type === 'guild') {
      const guild = this.discord.client.guilds.get(id);
      if (!guild)
        return msg.reply(`Guild **${id}** doesn't exist`);

      await this.database.blacklists.delete(id);
      return msg.reply(`:thumbsup: Whitelisted guild **${guild.name}** for *${reason ?? 'no reason provided'}*`);
    }

    if (type === 'user') {
      const user = await this.discord.getUser(id);
      if (user === null)
        return msg.reply(`User ${id} doesn't exist.`);

      await this.database.blacklists.delete(id);
      return msg.reply(`:thumbsup: Whitelisted user ${user.username}#${user.discriminator} for *${reason?.join(' ') ?? 'no reason, just felt like it.'}*`);
    }
  }
}
