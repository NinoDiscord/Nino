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
import { firstUpper } from '@augu/utils';
import type { Shard } from 'eris';
import { Inject } from '@augu/lilith';
import { Color } from '../../util/Constants';
import Discord from '../../components/Discord';

type ShardStatus = Shard['status'];

const hearts: { [P in ShardStatus]: string } = {
  disconnected: ':heart:',
  handshaking: ':yellow_heart:',
  connecting: ':yellow_heart:',
  resuming: ':blue_heart:',
  ready: ':green_heart:'
};

interface ShardInfo {
  current: boolean;
  status: ShardStatus;
  guilds: number;
  users: number;
  heart: string;
  id: number;
}

export default class ShardInfoCommand extends Command {
  @Inject
  private discord!: Discord;

  constructor() {
    super({
      description: 'descriptions.shardinfo',
      aliases: ['shard', 'shards'],
      cooldown: 6,
      name: 'shardinfo'
    });
  }

  run(msg: CommandMessage) {
    const shards = this.discord.client.shards.map<ShardInfo>(shard => ({
      current: msg.guild.shard.id === shard.id,
      status: shard.status,
      guilds: this.discord.client.guilds.filter(guild => guild.shard.id === shard.id).length,
      users: this.discord.client.guilds.filter(guild => guild.shard.id === shard.id).reduce((a, b) => a + b.memberCount, 0),
      heart: hearts[shard.status],
      id: shard.id
    }));

    const embed = new EmbedBuilder()
      .setColor(Color)
      .addFields(shards.map(shard => ({
        name: `❯ Shard #${shard.id}`,
        value: [
          `${shard.heart} **${firstUpper(shard.status)}**${shard.current ? ' (current)' : ''}`,
          '',
          `• **Guilds**: ${shard.guilds}`,
          `• **Users**: ${shard.users}`
        ].join('\n'),
        inline: true
      })));

    return msg.reply(embed);
  }
}
