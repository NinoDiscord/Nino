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

import { DiscordRESTError, User } from 'eris';
import { Command, CommandMessage } from '../../structures';
import { PunishmentType } from '../../entities/PunishmentsEntity';
import PunishmentService from '../../services/PunishmentService';
import { Categories } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Permissions from '../../util/Permissions';
import Discord from '../../components/Discord';
import ms = require('ms');

export default class MuteCommand extends Command {
  @Inject
  private punishments!: PunishmentService;

  @Inject
  private discord!: Discord;

  constructor() {
    super({
      userPermissions: 'manageMessages',
      botPermissions: 'manageRoles',
      description: 'descriptions.mute',
      category: Categories.Moderation,
      examples: [
        'mute @Nino',
        'mute @Nino bap!',
        'mute @Nino bap bap | 1d'
      ],
      usage: '<user> [reason [|time]]',
      name: 'mute'
    });
  }

  async run(msg: CommandMessage, [userID, ...reason]: [string, ...string[]]) {
    if (!userID)
      return msg.reply('No bot or user was specified.');

    let user!: User | null;
    try {
      user = await this.discord.getUser(userID);
    } catch(ex) {
      if (ex instanceof DiscordRESTError && ex.code === 10013)
        return msg.reply(`User or bot with ID "${userID}" was not found. (assuming it's a deleted bot or user)`);

      return msg.reply([
        'Uh-oh! An internal error has occured while running this.',
        'Contact the developers in discord.gg/ATmjFH9kMH under <#824071651486335036>:',
        '',
        '```js',
        ex.stack ?? '<... no stacktrace? ...>',
        '```'
      ].join('\n'));
    }

    if (user === null)
      return msg.reply('Bot or user was not found.');

    if (!msg.guild.members.has(user.id))
      return msg.reply('Cannot mute members outside the server.');

    const member = msg.guild.members.get(user.id)!;
    if (member.id === msg.guild.ownerID)
      return msg.reply('I don\'t think I can perform this action due to you kicking the owner, you idiot.');

    if (member.id === this.discord.client.user.id)
      return msg.reply('I don\'t have the Muted role.');

    if (member.permissions.has('administrator') || member.permissions.has('banMembers'))
      return msg.reply(`I can't perform this action due to **${user.username}#${user.discriminator}** being a server moderator.`);

    if (!Permissions.isMemberAbove(msg.member, member))
      return msg.reply(`User **${user.username}#${user.discriminator}** is the same or above as you.`);

    if (!Permissions.isMemberAbove(msg.self!, member))
      return msg.reply(`User **${user.username}#${user.discriminator}** is the same or above me.`);

    const areason = reason.join(' ');
    let actualReason: string | undefined = undefined;
    let time: string | undefined = undefined;

    if (areason !== '') {
      const [r, t] = areason.split(' | ');
      actualReason = r;
      time = t;
    }

    if (msg.settings.mutedRoleID !== undefined && member.roles.includes(msg.settings.mutedRoleID))
      return msg.reply('Member is already muted.');

    try {
      await this.punishments.apply({
        moderator: msg.author,
        publish: true,
        reason: actualReason,
        member,
        type: PunishmentType.Mute,
        time: time !== undefined ? ms(time) : undefined
      });

      return msg.reply(`${user.bot ? 'Bot' : 'User'} **${user.username}#${user.discriminator}** has been muted${actualReason ? ` *for ${actualReason}${time !== null ? ` in ${time}*` : ''}` : '.'}`);
    } catch(ex) {
      return msg.reply([
        'Uh-oh! An internal error has occured while running this.',
        'Contact the developers in discord.gg/ATmjFH9kMH under <#824071651486335036>:',
        '',
        '```js',
        ex.stack ?? '<... no stacktrace? ...>',
        '```'
      ].join('\n'));
    }
  }
}
