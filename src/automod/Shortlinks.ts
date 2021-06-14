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
import * as Constants from '../util/Constants';
import PermissionUtil from '../util/Permissions';
import { Automod } from '../structures';
import { Inject } from '@augu/lilith';
import Database from '../components/Database';
import Discord from '../components/Discord';

// tfw ice the adorable fluff does all the regex for u :woeme:
const LINK_REGEX = /(https?:\/\/)?(\w*\.\w*)/gi;

export default class Shortlinks implements Automod {
  public name: string = 'shortlinks';

  @Inject
  private punishments!: PunishmentService;

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  async onMessage(msg: Message<TextChannel>) {
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

    const settings = await this.database.automod.get(msg.author.id);
    if (settings !== undefined && settings.shortLinks === false)
      return false;

    const matches = msg.content.match(LINK_REGEX);
    if (matches === null)
      return false;

    // Why not use .find/.filter?
    // Because, it should traverse *all* matches, just not one match.
    //
    // So for an example:
    // "haha scam thing!!! floofy.dev bit.ly/jnksdjklsdsj"
    //
    // In the string, if `.find`/`.filter` was the solution here,
    // it'll only match "owo.com" and not "bit.ly"
    for (let i = 0; i < matches.length; i++) {
      if (Constants.SHORT_LINKS.includes(matches[i])) {
        await msg.delete();
        await msg.channel.createMessage('yo bro wtf dont send links like that >:(');
        await this.punishments.createWarning(msg.member, `[Automod] Sending a blacklisted URL in ${msg.channel.mention}`);

        return true;
      }
    }

    return false;
  }
}
