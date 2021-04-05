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
import { calculateHRTime } from '@augu/utils';
import CommandService from '../../services/CommandService';
import Discord from '../../components/Discord';
import K8s from '../../components/Kubernetes';

@LinkParent(CommandService)
export default class PingCommand extends Command {
  @Inject
  private discord!: Discord;

  @Inject
  private k8s!: K8s;

  constructor() {
    super({
      description: 'descriptions.ping',
      aliases: ['pong', 'latency', 'lat'],
      cooldown: 1,
      name: 'ping'
    });
  }

  async run(msg: CommandMessage) {
    const startedAt = process.hrtime();
    const message = await msg.reply('What did you want me to respond to?');
    const ping = calculateHRTime(startedAt);
    const node = await this.k8s.getCurrentNode();

    const deleteMsg = process.hrtime();
    await message.delete();

    const shard = this.discord.client.shards.get(msg.guild.shard.id)!;
    return msg.reply([
      `:satellite_orbital: Running under node **${node ?? 'unknown'}**`,
      '',
      `> **Message Delete**: ${calculateHRTime(deleteMsg).toFixed()}ms`,
      `> **Message Send**: ${ping.toFixed()}ms`,
      `> **Shard #${shard.id}**: ${shard.latency}ms`
    ].join('\n'));
  }
}
