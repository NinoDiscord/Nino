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

import type { RawPacket } from 'eris';
import { Logger } from 'tslog';
import { Inject } from '@augu/lilith';
import Subscribe from '../structures/decorators/Subscribe';
import Discord from '../components/Discord';
import Config from '../components/Config';
import Prom from '../components/Prometheus';

export default class VoidListener {
  @Inject
  private readonly prometheus?: Prom;

  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly config!: Config;

  @Subscribe('rawWS')
  onRawWS(packet: RawPacket) {
    if (!packet.t)
      return;

    this.prometheus?.rawWSEvents?.labels(packet.t).inc();
  }

  @Subscribe('ready')
  onReady() {
    this.logger.info(`Connected as ${this.discord.client.user.username}#${this.discord.client.user.discriminator} (ID: ${this.discord.client.user.id})`);
    this.logger.info(`Guilds: ${this.discord.client.guilds.size.toLocaleString()} | Users: ${this.discord.client.users.size.toLocaleString()}`);

    this.prometheus?.guildCount?.set(this.discord.client.guilds.size);
    this.discord.mentionRegex = new RegExp(`^<@!?${this.discord.client.user.id}> `);

    const prefixes = this.config.getProperty('prefixes') ?? ['x!'];
    const statusType = this.config.getProperty('status.type');
    const status = this.config.getProperty('status.status')!;

    this.discord.client.editStatus(this.config.getProperty('status.presence') ?? 'online', {
      name: status
        .replace('$prefix$', prefixes[Math.floor(Math.random() * prefixes.length)])
        .replace('$guilds$', this.discord.client.guilds.size.toLocaleString()),

      type: statusType ?? 0
    });
  }
}
