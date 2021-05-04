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

import { Command, CommandMessage } from '../../structures';
import { Inject, LinkParent } from '@augu/lilith';
import { PunishmentType } from '../../entities/PunishmentsEntity';
import PunishmentService from '../../services/PunishmentService';
import CommandService from '../../services/CommandService';
import { Categories } from '../../util/Constants';
import Redis from '../../components/Redis';

@LinkParent(CommandService)
export default class UnbanCommand extends Command {
  @Inject
  private punishments!: PunishmentService;

  @Inject
  private redis!: Redis;

  constructor() {
    super({
      userPermissions: 'banMembers',
      botPermissions: 'banMembers',
      description: 'descriptions.ban',
      category: Categories.Moderation,
      examples: [
        'unban @Nino',
        'unban @Nino some reason!'
      ],
      aliases: ['unbent', 'unbean'],
      usage: '<user> [reason]',
      name: 'unban'
    });
  }

  async run(msg: CommandMessage, [userID, ...reason]: [string, ...string[]]) {
    if (!userID)
      return msg.reply('No bot or user was specified.');

    try {
      await this.punishments.apply({
        moderator: msg.author,
        publish: true,
        reason: reason.join(' ') || 'No description was provided.',
        member: msg.guild.members.get(userID) || { id: userID, guild: msg.guild },
        type: PunishmentType.Unban
      });

      const timeouts = await this.redis.getTimeouts(msg.guild.id);
      const available = timeouts.filter(pkt =>
        pkt.type !== 'unban' && pkt.user !== userID
      );

      await this.redis.client.hmset('nino:timeouts', [msg.guild.id, available]);
      return msg.reply('User or bot has been unbanned successfully.');
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
