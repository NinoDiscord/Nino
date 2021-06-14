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

import type { Message, TextChannel } from 'eris';
import PunishmentService from '../services/PunishmentService';
import { Collection } from '@augu/collections';
import PermissionUtil from '../util/Permissions';
import { Automod } from '../structures';
import { Inject } from '@augu/lilith';
import Database from '../components/Database';
import Discord from '../components/Discord';

export default class Mentions implements Automod {
  private cache: Collection<string, Collection<string, number[]>> = new Collection();
  public name: string = 'mentions';

  @Inject
  private punishments!: PunishmentService;

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  async onMessage(msg: Message<TextChannel>) {
    const settings = await this.database.automod.get(msg.guildID);
    if (settings === undefined || settings.invites === false)
      return false;

    if (!msg || msg === null)
      return false;

    const nino = msg.channel.guild.members.get(this.discord.client.user.id)!;

    if (
      msg.member !== null &&
      !PermissionUtil.isMemberAbove(nino, msg.member) ||
      !msg.channel.permissionsOf(this.discord.client.user.id).has('manageMessages') ||
      msg.author.bot ||
      msg.channel.permissionsOf(msg.author.id).has('banMembers')
    ) return false;

    const queue = this.get(msg.guildID, msg.author.id);
    queue.push(msg.timestamp);

    if (queue.length >= 5) {
      const old = queue.shift()!;
      if (msg.editedTimestamp && msg.editedTimestamp > msg.timestamp)
        return false;

      if (msg.timestamp - old <= 3000) {
        this.clear(msg.guildID, msg.author.id);
        await msg.channel.createMessage('o(╥﹏╥)o pls don\'t spam...');
        await this.punishments.createWarning(msg.member, `[Automod] Spamming in ${msg.channel.mention} o(╥﹏╥)o`);
        return true;
      }
    }

    this.clean(msg.guildID);
    return false;
  }

  private clean(guildID: string) {
    const now = Date.now();
    const buckets = this.cache.get(guildID);

    // Let's just not do anything if there is no spam cache for this guild
    if (buckets === undefined)
      return;

    const ids = buckets.filterKeys(val => now - val[val.length - 1] >= 5000);
    for (const id of ids)
      this.cache.delete(id);
  }

  private get(guildID: string, userID: string) {
    if (!this.cache.has(guildID))
      this.cache.set(guildID, new Collection());

    if (!this.cache.get(guildID)!.has(userID))
      this.cache.get(guildID)!.set(userID, []);

    return this.cache.get(guildID)!.get(userID)!;
  }

  private clear(guildID: string, userID: string) {
    this.cache.get(guildID)!.delete(userID);
  }
}
