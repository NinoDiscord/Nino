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

import { DiscordRESTError, Member, User } from 'eris';
import { Command, CommandMessage } from '../../structures';
import { Inject, LinkParent } from '@augu/lilith';
import { PunishmentType } from '../../entities/PunishmentsEntity';
import PunishmentService from '../../services/PunishmentService';
import CommandService from '../../services/CommandService';
import { Categories } from '../../util/Constants';
import Permissions from '../../util/Permissions';
import Discord from '../../components/Discord';

interface Flags {
  days?: string | true;
  d?: string | true;
}

@LinkParent(CommandService)
export default class SoftbanCommand extends Command {
  @Inject
  private punishments!: PunishmentService;

  @Inject
  private discord!: Discord;

  constructor() {
    super({
      userPermissions: 'banMembers',
      botPermissions: 'banMembers',
      description: 'Softly bans a user for optionally, a short period of time',
      examples: [
        'softban 154254569632587456',
        'softban 154254569632587456 bad!',
        'softban @Nino bad bot!',
        'softban @Nino bad bot! -d 7',
        'softban 154254569632587456 bad bot! --days=7'
      ],
      usage: '<user> [reason] [--days | -d]',
      name: 'softban'
    });
  }

  async run(msg: CommandMessage, [userID, ...reason]: [string, string]) {
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
      return msg.reply(`Bot or user **${user.username}#${user.discriminator}** must be in the guild to perform this action.`);

    const member = msg.guild.members.get(user.id)!;
    if (member.id === msg.guild.ownerID)
      return msg.reply('I don\'t think I can perform this action due to you banning the owner, you idiot.');

    if (member.id === this.discord.client.user.id)
      return msg.reply(';w; why would you soft-ban me from here? **(／。＼)**');

    if (member instanceof Member) { // this won't work for banning members not in this guild
      if (member.permissions.has('administrator') || member.permissions.has('banMembers'))
        return msg.reply(`I can't perform this action due to **${user.username}#${user.discriminator}** being a server moderator.`);

      if (!Permissions.isMemberAbove(msg.member, member))
        return msg.reply(`User **${user.username}#${user.discriminator}** is the same or above you.`);

      if (!Permissions.isMemberAbove(msg.self, member))
        return msg.reply(`User **${user.username}#${user.discriminator}** is the same or above me.`);
    }

    const flags = msg.flags<Flags>();
    if (typeof flags.days === 'boolean' || typeof flags.d === 'boolean')
      return msg.reply('The `--days` flag must have a value appended. Example: `--days=7` or `-d 7`');

    const days = flags.days ?? flags.d ?? 7;
    if (Number(days) > 7)
      return msg.reply('You can only concat 7 days worth of messages');

    try {
      await this.punishments.apply({
        moderator: msg.author,
        publish: true,
        reason: reason.join(' '),
        member: msg.guild.members.get(user.id) || { id: user.id, guild: msg.guild },
        soft: true,
        type: PunishmentType.Ban,
        days: Number(days)
      });

      return msg.reply(`${user.bot ? 'Bot' : 'User'} **${user.username}#${user.discriminator}** has been banned${reason ? ` *for ${reason}*` : ''}`);
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
