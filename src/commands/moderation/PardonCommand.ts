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

import { DiscordRESTError, User, Member } from 'eris';
import { Command, CommandMessage } from '../../structures';
import PunishmentService from '../../services/PunishmentService';
import { Categories } from '../../util/Constants';
import Permissions from '../../util/Permissions';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Discord from '../../components/Discord';

export default class PardonCommand extends Command {
  @Inject
  private readonly punishments!: PunishmentService;

  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  constructor() {
    super({
      userPermissions: 'kickMembers',
      description: 'descriptions.pardon',
      category: Categories.Moderation,
      examples: ['pardon 280158289667555328 1', 'pardon 280158289667555328 1 yes'],
      aliases: ['rmwarn', 'rmw'],
      usage: '<user> [amount] [...reason]',
      name: 'pardon',
    });
  }

  async run(msg: CommandMessage, [userID, amount, ...reason]: string[]) {
    if (!userID) return msg.reply('No bot or user was specified.');

    let user!: User | null;
    try {
      user = await this.discord.getUser(userID);
    } catch (ex) {
      if (ex instanceof DiscordRESTError && ex.code === 10013)
        return msg.reply(`User or bot with ID "${userID}" was not found. (assuming it's a deleted bot or user)`);

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

    if (!msg.guild.members.has(user.id)) return msg.reply('Cannot warn members outside the server.');

    const member = msg.guild.members.get(user.id)!;
    if (!(member instanceof Member)) return msg.reply("Cannot remove warnings from a member that isn't here.");

    if (member.id === msg.guild.ownerID)
      return msg.reply("I don't think I can perform this action due to you kicking the owner, you idiot.");

    if (member.id === this.discord.client.user.id) return msg.reply(';w; why would you warn me? **(／。＼)**');

    if (member.permissions.has('administrator') || member.permissions.has('banMembers'))
      return msg.reply(
        `I can't perform this action due to **${user.username}#${user.discriminator}** being a server moderator.`
      );

    if (!Permissions.isMemberAbove(msg.member, member))
      return msg.reply(`User **${user.username}#${user.discriminator}** is the same or above as you.`);

    if (!Permissions.isMemberAbove(msg.self!, member))
      return msg.reply(`User **${user.username}#${user.discriminator}** is the same or above me.`);

    const actualAmount = amount !== 'all' ? Number(amount) : 'all';
    if (actualAmount !== 'all' && isNaN(actualAmount))
      return msg.reply(`The amount provided (\`${amount}\`) was not a number.`);

    try {
      await this.punishments.removeWarning(
        msg.guild.members.get(user.id)!,
        reason.join(' ') || 'No reason was provided.',
        actualAmount
      );

      const warnings = await this.database.warnings.getAll(msg.guild.id, user.id);
      const _amount = warnings.reduce((acc, curr) => acc + curr.amount, 0);
      return msg.reply(
        `User **${user.username}#${user.discriminator}** now has **${_amount === 0 ? 'no' : _amount}** warnings left.`
      );
    } catch (ex) {
      if (ex instanceof RangeError || ex instanceof SyntaxError) return msg.error(ex.message);

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
