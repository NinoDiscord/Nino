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
import { PunishmentType } from '../../entities/PunishmentsEntity';
import PunishmentService from '../../services/PunishmentService';
import { Categories } from '../../util/Constants';
import Permissions from '../../util/Permissions';
import { Inject } from '@augu/lilith';
import Discord from '../../components/Discord';
import ms = require('ms');

interface BanFlags {
  soft?: string | true;
  days?: string | true;
  d?: string | true;
}

export default class BanCommand extends Command {
  @Inject
  private punishments!: PunishmentService;

  @Inject
  private discord!: Discord;

  constructor() {
    super({
      userPermissions: 'banMembers',
      botPermissions: 'banMembers',
      description: 'descriptions.ban',
      category: Categories.Moderation,
      examples: [
        'ban @Nino',
        'ban @Nino some reason!',
        'ban @Nino some reason! | 1d',
        'ban @Nino some reason! | 1d -d 7',
      ],
      aliases: ['banne', 'bent', 'bean'],
      usage: '<user> [reason [| time]]',
      name: 'ban',
    });
  }

  async run(msg: CommandMessage, args: string[]) {
    if (args.length < 1) return msg.reply('No bot or user was specified.');

    const userID = args[0];
    let user!: User | null;
    try {
      user = await this.discord.getUser(userID);
    } catch (ex) {
      if (ex instanceof DiscordRESTError && ex.code === 10013)
        return msg.reply(
          `User or bot with ID "${userID}" was not found. (assuming it's a deleted bot or user)`
        );

      return msg.reply(
        [
          'Uh-oh! An internal error has occured while running this.',
          'Contact the developers in discord.gg/ATmjFH9kMH under <#824071651486335036>:',
          '',
          '```js',
          ex.stack ?? '<... no stacktrace? ...>',
          '```',
        ].join('\n')
      );
    }

    if (user === null) return msg.reply('Bot or user was not found.');

    const member = msg.guild.members.get(user.id) ?? {
      id: user.id,
      guild: msg.guild,
    };
    if (member.id === msg.guild.ownerID)
      return msg.reply(
        "I don't think I can perform this action due to you banning the owner, you idiot."
      );

    if (member.id === this.discord.client.user.id)
      return msg.reply(';w; why would you ban me from here? **(／。＼)**');

    if (member instanceof Member) {
      // this won't work for banning members not in this guild
      if (
        member.permissions.has('administrator') ||
        member.permissions.has('banMembers')
      )
        return msg.reply(
          `I can't perform this action due to **${user.username}#${user.discriminator}** being a server moderator.`
        );

      if (!Permissions.isMemberAbove(msg.member, member))
        return msg.reply(
          `User **${user.username}#${user.discriminator}** is the same or above you.`
        );

      if (!Permissions.isMemberAbove(msg.self!, member))
        return msg.reply(
          `User **${user.username}#${user.discriminator}** is the same or above me.`
        );
    }

    const ban = await msg.guild.getBan(user.id).catch(() => null);
    if (ban !== null)
      return msg.reply(
        `${user.bot ? 'Bot' : 'User'} was previously banned for ${
          ban.reason ?? '*(no reason provided)*'
        }`
      );

    args.shift(); // remove user ID

    let reason = args.length > 0 ? args.join(' ') : undefined;
    let time: string | null = null;

    if (reason !== undefined) {
      const [r, t] = reason.split(' | ');
      reason = r;
      time = t ?? null;
    }

    const flags = msg.flags<BanFlags>();
    if (typeof flags.days === 'boolean' || typeof flags.d === 'boolean')
      return msg.reply(
        'The `--days` flag must have a value appended. Example: `--days=7` or `-d 7`'
      );

    const days = flags.days ?? flags.d ?? 7;
    if (Number(days) > 7)
      return msg.reply('You can only concat 7 days worth of messages');

    if (flags.soft !== undefined)
      await msg.reply(
        'Flag `--soft` is deprecated and will be removed in a future release, use the `softban` command.'
      );

    try {
      await this.punishments.apply({
        attachments: msg.attachments,
        moderator: msg.author,
        publish: true,
        reason,
        member: msg.guild.members.get(user.id) || {
          id: user.id,
          guild: msg.guild,
        },
        soft: flags.soft === true,
        type: PunishmentType.Ban,
        days: Number(days),
        time: time !== null ? ms(time) : undefined,
      });

      return msg.reply(
        `${user.bot ? 'Bot' : 'User'} **${user.username}#${
          user.discriminator
        }** has been banned${
          reason ? ` *for ${reason}${time !== null ? ` in ${time}` : ''}` : '.'
        }*`
      );
    } catch (ex) {
      if (ex instanceof DiscordRESTError && ex.code === 10007) {
        return msg.reply(
          `Member **${user.username}#${user.discriminator}** has left but been detected. Kinda weird if you ask me, to be honest.`
        );
      }

      return msg.reply(
        [
          'Uh-oh! An internal error has occured while running this.',
          'Contact the developers in discord.gg/ATmjFH9kMH under <#824071651486335036>:',
          '',
          '```js',
          ex.stack ?? '<... no stacktrace? ...>',
          '```',
        ].join('\n')
      );
    }
  }
}
