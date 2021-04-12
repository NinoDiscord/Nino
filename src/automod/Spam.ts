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
import { Inject, LinkParent } from '@augu/lilith';
import PunishmentService from '../services/PunishmentService';
import PermissionUtil from '../util/Permissions';
import AutomodService from '../services/AutomodService';
import { Automod } from '../structures';
import Database from '../components/Database';
import Discord from '../components/Discord';
import { Collection } from '@augu/collections';

@LinkParent(AutomodService)
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

    return false;
  }

  private clean(guildID: string) {
    const now = Date.now();
    const buckets = this.cache.get(guildID);

    // Let's just not do anything if there is no spam cache for this guild
    if (buckets === undefined)
      return;
  }
}

// old code
/*
  __cleanUp(guildId: string) {
    let now = Date.now();
    let ids: (string | number)[] = [];
    this.buckets.get(guildId)!.forEach((v, k) => {
      let diff = now - v[v.length-1];
      if (now - v[v.length - 1] >= 5000) {
        ids.push(k);
      }
    });
    ids.forEach(element => {
      this.buckets.delete(element);
    });
  }

  __getQueue(guildId: string, userId: string): number[] {
    if (!this.buckets.has(guildId)) {
      this.buckets.set(guildId, new Collection<number[]>());
    }
    if (!this.buckets.get(guildId)!.has(userId)) {
      this.buckets.get(guildId)!.set(userId, []);
    }
    return this.buckets.get(guildId)!.get(userId)!;
  }

  __clearQueue(guildId: string, userId: string) {
    this.buckets.get(guildId)!.delete(userId);
  }
*/
