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
import PermissionUtil from '../util/Permissions';
import { Automod } from '../structures';
import { Inject } from '@augu/lilith';
import Database from '../components/Database';
import Discord from '../components/Discord';

export default class BlacklistAutomod implements Automod {
  public name: string = 'blacklists';

  @Inject
  private punishments!: PunishmentService;

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  async onMessage(msg: Message<TextChannel>) {
    const settings = await this.database.automod.get(msg.guildID);
    if (settings === undefined || settings.blacklist === false)
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

    const content = msg.content.toLowerCase().split(' ');
    for (const word of settings.blacklistWords) {
      if (content.filter(c => c === word.toLowerCase()).length > 0) {
        await msg.channel.createMessage('hey, that\'s a word this server doesn\'t want you to say (☍﹏⁰)｡');
        await msg.delete();
        await this.punishments.createWarning(msg.member, '[Automod] User said a word that is blacklisted here (☍﹏⁰)｡');

        return true;
      }
    }

    return false;
  }
}
