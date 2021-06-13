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

import { Command, CommandMessage, EmbedBuilder } from '../../structures';
import { Categories, Color } from '../../util/Constants';
import { BlacklistType } from '../../entities/BlacklistEntity';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import Config from '../../components/Config';

export default class BlacklistCommand extends Command {
  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  @Inject
  private config!: Config;

  constructor() {
    super({
      description: 'Blacklists a user or guild from Nino',
      category: Categories.Owner,
      hidden: true,
      ownerOnly: true,
      aliases: ['bl'],
      usage: '["guild" | "user"] [id] [...reason]',
      name: 'blacklist'
    });
  }

  async run(msg: CommandMessage, [type, id, ...reason]: ['guild' | 'user', string, ...string[]]) {
    if (!type) {
      const guilds = await this.database.blacklists.getByType(BlacklistType.Guild);
      const users = await this.database.blacklists.getByType(BlacklistType.User);

      return msg.reply(
        new EmbedBuilder()
          .setColor(Color)
          .setDescription([
            `❯ **Guilds Blacklisted**: ${guilds.length.toLocaleString()}`,
            `❯ **Users Blacklisted**: ${users.length.toLocaleString()}`
          ])
      );
    }

    if (!['guild', 'user'].includes(type))
      return msg.reply('Missing the type to blacklist. Available options: `user` and `guild`.');

    if (type === 'guild') {
      const guild = this.discord.client.guilds.get(id);
      if (!guild)
        return msg.reply(`Guild **${id}** doesn't exist`);

      const entry = await this.database.blacklists.get(id);
      if (entry !== undefined)
        return msg.reply(`Guild **${guild.name}** is already on the blacklist.`);

      await this.database.blacklists.create({
        issuer: msg.author.id,
        reason: reason ? reason.join(' ') : undefined,
        type: BlacklistType.Guild,
        id
      });

      return msg.reply(`:thumbsup: Blacklisted guild **${guild.name}** for *${reason ?? 'no reason provided'}*`);
    }

    if (type === 'user') {
      const owners = this.config.getProperty('owners') ?? [];
      const user = await this.discord.getUser(id);
      if (user === null)
        return msg.reply(`User ${id} doesn't exist.`);

      if (owners.includes(id))
        return msg.reply('Cannot blacklist a owner');

      const entry = await this.database.blacklists.get(user.id);
      if (entry !== undefined)
        return msg.reply(`User **${user.username}#${user.discriminator}** is already on the blacklist.`);

      await this.database.blacklists.create({
        issuer: msg.author.id,
        reason: reason ? reason.join(' ') : undefined,
        type: BlacklistType.User,
        id: user.id
      });

      return msg.reply(`:thumbsup: Blacklisted user ${user.username}#${user.discriminator} for *${reason?.join(' ') ?? 'no reason, just felt like it.'}*`);
    }
  }
}
