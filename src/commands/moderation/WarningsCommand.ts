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

import { Command, CommandMessage, EmbedBuilder } from '../../structures';
import { DiscordRESTError, User } from 'eris';
import { Categories } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Discord from '../../components/Discord';

export default class WarningsCommand extends Command {
  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  constructor() {
    super({
      description: 'descriptions.warnings',
      category: Categories.Moderation,
      examples: ['warnings 280158289667555328'],
      aliases: ['warns', 'view-warns'],
      name: 'warnings',
    });
  }

  async run(msg: CommandMessage, [userID]: string[]) {
    if (!userID) return msg.reply('No user was specified.');

    let user!: User | null;
    try {
      user = await this.discord.getUser(userID);
    } catch (ex) {
      if (ex instanceof DiscordRESTError && ex.code === 10013)
        return msg.reply(`User with ID "${userID}" was not found. (assuming it's a deleted user)`);

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

    if (!msg.guild.members.has(user.id)) return msg.reply('Cannot view warnings outside of this guild.');

    if (user.bot) return msg.reply('Bots cannot be warned.');

    const member = msg.guild.members.get(user.id)!;
    if (member.id === msg.guild.ownerID) return msg.reply('Why would the server owner have any warnings...?');

    if (member.id === this.discord.client.user.id) return msg.reply('W-why would I have any warnings?!');

    if (member.permissions.has('administrator') || member.permissions.has('banMembers'))
      return msg.reply('Moderators or administrators don\'t have warnings attached to them.');

    const warnings = await this.database.warnings
      .getAll(msg.guild.id, user.id)
      .then((warnings) => warnings.filter((warn) => warn.amount > 0));
    if (warnings.length === 0)
      return msg.reply(`User **${user.username}#${user.discriminator}** doesn't have any warnings attached to them.`);

    const embed = EmbedBuilder.create()
      .setTitle(`[ ${user.username}#${user.discriminator} (${user.id}) <~> Warnings ]`)
      .setDescription(`They have a total of **${warnings.length}** warnings attached`)
      .addFields(
        warnings.map((warn, idx) => ({
          name: `❯ Warning #${idx + 1}`,
          value: [`• **Amount**: ${warn.amount}`, `• **Reason**: ${warn.reason ?? '(no reason was provided)'}`].join('\n'),
          inline: true,
        }))
      );

    return msg.reply(embed);
  }
}
