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

import { Inject, Subscribe } from '@augu/lilith';
import type { RawPacket } from 'eris';
import BotlistsService from '../services/BotlistService';
import AutomodService from '../services/AutomodService';
import { Logger } from 'tslog';
import Discord from '../components/Discord';
import Config from '../components/Config';
import Redis from '../components/Redis';
import Prom from '../components/Prometheus';

export default class VoidListener {
  @Inject
  private readonly prometheus?: Prom;

  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly botlists?: BotlistsService;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly redis!: Redis;

  @Inject
  private readonly config!: Config;

  @Subscribe('rawWS', 'discord')
  onRawWS(packet: RawPacket) {
    if (!packet.t)
      return;

    this.prometheus?.rawWSEvents?.labels(packet.t).inc();
  }

  @Subscribe('ready', 'discord')
  async onReady() {
    this.logger.info(`Connected as ${this.discord.client.user.username}#${this.discord.client.user.discriminator} (ID: ${this.discord.client.user.id})`);
    this.logger.info(`Guilds: ${this.discord.client.guilds.size.toLocaleString()} | Users: ${this.discord.client.users.size.toLocaleString()}`);

    this.prometheus?.guildCount?.set(this.discord.client.guilds.size);
    await this.botlists?.post();
    this.discord.mentionRegex = new RegExp(`^<@!?${this.discord.client.user.id}> `);

    const prefixes = this.config.getProperty('prefixes') ?? ['x!'];
    const statusType = this.config.getProperty('status.type');
    const status = this.config.getProperty('status.status')!;

    const raids = await this.redis.client.keys('nino:raid:lockdown:indicator:*');
    const automod = app.$ref<AutomodService>(AutomodService);

    for (const c of raids) {
      const [, guildID] = c.split(' | ');

      await this.redis.client.del(`nino:raid:lockdown:indicator:${guildID}`);
      if (this.discord.client.guilds.has(guildID)) {
        await automod['_restore'](this.discord.client.guilds.get(guildID)!);
      }
    }

    for (const shard of this.discord.client.shards.values()) {
      this.discord.client.editStatus(this.config.getProperty('status.presence') ?? 'online', {
        name: status
          .replace('$prefix$', prefixes[Math.floor(Math.random() * prefixes.length)])
          .replace('$guilds$', this.discord.client.guilds.size.toLocaleString())
          .replace('$shard$', `#${shard.id}`),

        type: statusType ?? 0
      });
    }
  }
}
