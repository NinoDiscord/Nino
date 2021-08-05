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
import type { Timeout } from '../../components/timeouts/types';
import { Categories } from '../../util/Constants';
import { firstUpper } from '@augu/utils';
import { Inject } from '@augu/lilith';
import Discord from '../../components/Discord';
import Redis from '../../components/Redis';

export default class TimeoutsCommand extends Command {
  @Inject
  private discord!: Discord;

  @Inject
  private redis!: Redis;

  constructor() {
    super({
      userPermissions: 'manageMessages',
      botPermissions: 'manageMessages',
      description: 'descriptions.timeouts',
      category: Categories.Moderation,
      examples: ['timeouts', 'timeouts unban'],
      name: 'timeouts',
    });
  }

  async run(msg: CommandMessage, [type]: [string]) {
    return type !== undefined ? this._sendTimeoutsAsSpecific(msg, type) : this._sendTimeouts(msg);
  }

  private async _sendTimeoutsAsSpecific(msg: CommandMessage, type: string) {
    const timeouts = await this.redis.client
      .hget('nino:timeouts', msg.guild.id)
      .then((value) => (value !== null ? JSON.parse<Timeout[]>(value) : []))
      .catch(() => [] as Timeout[]);

    if (!timeouts.length) return msg.reply(`Guild **${msg.guild.name}** doesn't have any concurrent timeouts.`);

    const all = timeouts.filter((p) => p.type.toLowerCase() === type.toLowerCase());
    if (!all.length) return msg.reply(`Punishment type **${type}** didn't have any timeouts.`);

    const h = await Promise.all(
      all.slice(0, 10).map(async (pkt, idx) => {
        const user = await this.discord
          .getUser(pkt.user)
          .then((user) =>
            user === null
              ? {
                  username: 'Unknown User',
                  discriminator: '0000',
                  id: pkt.user,
                }
              : user!
          )
          .catch(() => ({
            username: 'Unknown User',
            discriminator: '0000',
            id: pkt.user,
          }));

        const moderator = this.discord.client.users.get(pkt.moderator) ?? {
          username: 'Unknown User',
          discriminator: '0000',
        };
        const issuedAt = new Date(pkt.issued);
        return {
          name: `❯ #${idx + 1}: User ${user!.username}#${user!.discriminator}`,
          value: [
            `• **Issued At**: ${issuedAt.toUTCString()}`,
            `• **Expires At**: ${new Date(pkt.expired).toUTCString()}`,
            `• **Moderator**: ${moderator.username}#${moderator.discriminator}`,
            `• **Reason**: ${pkt.reason ?? '*No reason was defined.*'}`,
          ].join('\n'),
          inline: true,
        };
      })
    );

    const embed = EmbedBuilder.create()
      .setAuthor(
        `[ Timeouts in ${msg.guild.name} (${msg.guild.id}) ]`,
        undefined,
        msg.guild.dynamicIconURL('png', 1024)
      )
      .addFields(h)
      .setFooter('Only showing 10 entries.');

    return msg.reply(embed);
  }

  private async _sendTimeouts(msg: CommandMessage) {
    const timeouts = await this.redis.client
      .hget('nino:timeouts', msg.guild.id)
      .then((value) => (value !== null ? JSON.parse<Timeout[]>(value) : []))
      .catch(() => [] as Timeout[]);

    if (!timeouts.length) return msg.reply(`Guild **${msg.guild.name}** doesn't have any concurrent timeouts.`);

    const h = await Promise.all(
      timeouts.slice(0, 10).map(async (pkt, idx) => {
        const user = await this.discord
          .getUser(pkt.user)
          .then((user) =>
            user === null
              ? {
                  username: 'Unknown User',
                  discriminator: '0000',
                  id: pkt.user,
                }
              : user!
          )
          .catch(() => ({
            username: 'Unknown User',
            discriminator: '0000',
            id: pkt.user,
          }));

        const moderator = this.discord.client.users.get(pkt.moderator) ?? {
          username: 'Unknown User',
          discriminator: '0000',
        };
        const issuedAt = new Date(pkt.issued);
        return {
          name: `❯ #${idx + 1}: User ${user!.username}#${user!.discriminator}`,
          value: [
            `• **Issued At**: ${issuedAt.toUTCString()}`,
            `• **Expires At**: ${new Date(pkt.expired).toDateString()}`,
            `• **Moderator**: ${moderator.username}#${moderator.discriminator}`,
            `• **Reason**: ${pkt.reason ?? '*No reason was defined.*'}`,
            `• **Punishment**: ${firstUpper(pkt.type)}`,
          ].join('\n'),
          inline: true,
        };
      })
    );

    const embed = EmbedBuilder.create()
      .setAuthor(
        `[ Timeouts in ${msg.guild.name} (${msg.guild.id}) ]`,
        undefined,
        msg.guild.dynamicIconURL('png', 1024)
      )
      .addFields(h)
      .setFooter('Only showing 10 entries.');

    return msg.reply(embed);
  }
}
