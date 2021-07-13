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

import { DiscordRESTError, Invite, Message, TextChannel } from 'eris';
import LocalizationService from '../services/LocalizationService';
import PunishmentService from '../services/PunishmentService';
import * as Constants from '../util/Constants';
import PermissionUtil from '../util/Permissions';
import { Automod } from '../structures';
import { Inject } from '@augu/lilith';
import Database from '../components/Database';
import Discord from '../components/Discord';

export default class Invites implements Automod {
  public name: string = 'invites';

  @Inject
  private readonly punishments!: PunishmentService;

  @Inject
  private readonly database!: Database;

  @Inject
  private readonly locales!: LocalizationService;

  @Inject
  private readonly discord!: Discord;

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

    if (msg.content.match(Constants.DISCORD_INVITE_REGEX) !== null) {
      const invites = await msg.channel.guild.getInvites()
        .then(invites => invites.map(i => i.code))
        .catch(() => [] as unknown as string[]);

      // Guild#getInvites doesn't add vanity urls, so we have to do it ourselves
      if (msg.channel.guild.features.includes('VANITY_URL') && msg.channel.guild.vanityURL !== null)
        invites.push(msg.channel.guild.vanityURL);

      const regex = Constants.DISCORD_INVITE_REGEX.exec(msg.content);
      if (regex === null)
        return false;

      const code = regex[0]?.split('/').pop();
      if (code === undefined)
        return false;

      let invalid = false;
      try {
        const invite = await this.discord.client.requestHandler.request(
          'GET',
          `/invites/${code}`,
          true
        ).then(data => new Invite(data as any, this.discord.client)).catch(() => null);

        if (invite === null) {
          invalid = true;
        } else {
          const hasInvite = invites.filter(inv => inv === invite.code).length > 0;
          if (!hasInvite && invite.guild !== undefined && invite.guild.id === msg.channel.guild.id)
            invites.push(invite.code);
        }
      } catch(ex) {
        if (ex instanceof DiscordRESTError && ex.code === 100006 && ex.message.includes('Unknown Invite'))
          invalid = true;
      }

      if (invalid)
        return false;

      if (invites.find(inv => inv === code))
        return false;

      const language = this.locales.get(msg.guildID, msg.author.id);

      await msg.channel.createMessage(language.translate('automod.invites'));
      await msg.delete();
      await this.punishments.createWarning(msg.member, `[Automod] Advertising in ${msg.channel.mention}`);

      return true;
    }

    return false;
  }
}
