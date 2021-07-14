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

import { Inject, Subscribe } from '@augu/lilith';
import AutomodService from '../services/AutomodService';
import type { User } from 'eris';
import Database from '../components/Database';
import Discord from '../components/Discord';

export default class UserListener {
  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly automod!: AutomodService;

  @Subscribe('userUpdate', { emitter: 'discord' })
  async onUserUpdate(user: User) {
    const mutualGuilds = this.discord.client.guilds.filter(guild =>
      guild.members.has(user.id)
    );

    for (const guild of mutualGuilds) {
      const automod = await this.database.automod.get(guild.id);
      if (!automod)
        continue;

      if (automod.dehoist === true)
        await this.automod.run('memberNick', guild.members.get(user.id)!);
    }
  }
}
