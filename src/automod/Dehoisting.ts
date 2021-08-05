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

import type { Member } from 'eris';
import { Automod } from '../structures';
import { Inject } from '@augu/lilith';
import Database from '../components/Database';
import Discord from '../components/Discord';

export default class Dehoisting implements Automod {
  public name: string = 'dehoisting';

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  async onMemberNickUpdate(member: Member) {
    const settings = await this.database.automod.get(member.guild.id);
    if (settings !== undefined && settings.dehoist === false) return false;

    if (member.nick === null) return false;

    if (!member.guild.members.get(this.discord.client.user.id)?.permissions.has('manageNicknames')) return false;

    if (member.nick[0] < '0') {
      const origin = member.nick;
      await member.edit(
        { nick: 'hoister' },
        `[Automod] Member ${member.username}#${member.discriminator} has updated their nick to "${origin}" and dehoisting is enabled.`
      );

      return true;
    }

    return false;
  }
}
