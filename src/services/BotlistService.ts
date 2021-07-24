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

/* eslint-disable camelcase */

import { Service, Inject } from '@augu/lilith';
import { HttpClient } from '@augu/orchid';
import { Logger } from 'tslog';
import Discord from '../components/Discord';
import Config from '../components/Config';

@Service({
  priority: 1,
  name: 'botlists',
})
export default class BotlistsService {
  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly config!: Config;

  @Inject
  private readonly http!: HttpClient;

  #interval?: NodeJS.Timer;

  async load() {
    const botlists = this.config.getProperty('botlists');
    if (botlists === undefined) {
      this.logger.warn(
        "`botlists` is missing, don't need to add it if running privately."
      );
      return Promise.resolve();
    }

    this.logger.info('Built scheduler for posting to botlists!');
    this.#interval = setInterval(this.post.bind(this), 86400000).unref();
  }

  dispose() {
    if (this.#interval) clearInterval(this.#interval);
  }

  async post() {
    const list: {
      name:
        | 'Discord Services'
        | 'Discord Boats'
        | 'Discord Bots'
        | 'top.gg'
        | 'Delly'
        | 'Bots for Discord';
      success: boolean;
      data: Record<string, any>;
    }[] = [];

    let success = 0;
    let errored = 0;
    const botlists = this.config.getProperty('botlists')!;

    if (botlists === undefined) return;

    if (botlists.dservices !== undefined) {
      this.logger.info('Found Discord Services token, now posting...');

      await this.http
        .request({
          url: `https://api.discordservices.net/bot/${this.discord.client.user.id}/stats`,
          method: 'POST',
          data: {
            server_count: this.discord.client.guilds.size,
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: botlists.dservices,
          },
        })
        .then((res) => {
          res.statusCode === 200 ? success++ : errored++;
          list.push({
            name: 'Discord Services',
            success: res.statusCode === 200,
            data: res.json(),
          });
        })
        .catch((ex) =>
          this.logger.warn('Unable to parse JSON [discordservices.net]:', ex)
        );
    }

    if (botlists.dboats !== undefined) {
      this.logger.info('Found Discord Boats token, now posting...');

      await this.http
        .request({
          data: {
            server_count: this.discord.client.guilds.size,
          },
          method: 'POST',
          url: `https://discord.boats/api/bot/${this.discord.client.user.id}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: botlists.dboats,
          },
        })
        .then((res) => {
          res.statusCode === 200 ? success++ : errored++;
          list.push({
            name: 'Discord Boats',
            success: res.statusCode === 200,
            data: res.json(),
          });
        })
        .catch((ex) =>
          this.logger.warn('Unable to parse JSON [discord.boats]:', ex)
        );
    }

    if (botlists.dbots !== undefined) {
      this.logger.info('Found Discord Bots token, now posting...');

      await this.http
        .request({
          url: `https://discord.bots.gg/api/v1/bots/${this.discord.client.user.id}/stats`,
          method: 'POST',
          data: {
            shardCount: this.discord.client.shards.size,
            guildCount: this.discord.client.guilds.size,
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: botlists.dbots,
          },
        })
        .then((res) => {
          res.statusCode === 200 ? success++ : errored++;
          list.push({
            name: 'Discord Bots',
            success: res.statusCode === 200,
            data: res.json(),
          });
        })
        .catch((ex) =>
          this.logger.warn('Unable to parse JSON [discord.bots.gg]:', ex)
        );
    }

    if (botlists.topgg !== undefined) {
      this.logger.info('Found top.gg token, now posting...');

      await this.http
        .request({
          url: `https://top.gg/api/bots/${this.discord.client.user.id}/stats`,
          method: 'POST',
          data: {
            server_count: this.discord.client.guilds.size,
            shard_count: this.discord.client.shards.size,
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: botlists.topgg,
          },
        })
        .then((res) => {
          res.statusCode === 200 ? success++ : errored++;
          list.push({
            name: 'top.gg',
            success: res.statusCode === 200,
            data: res.json(),
          });
        })
        .catch((ex) => this.logger.warn('Unable to parse JSON [top.gg]:', ex));
    }

    // Ice is a cute boyfriend btw <3
    if (botlists.delly !== undefined) {
      this.logger.info('Found Discord Extreme List token, now posting...');

      await this.http
        .request({
          url: `https://api.discordextremelist.xyz/v2/bot/${this.discord.client.user.id}/stats`,
          method: 'POST',
          data: {
            guildCount: this.discord.client.guilds.size,
            shardCount: this.discord.client.shards.size,
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: botlists.delly,
          },
        })
        .then((res) => {
          res.statusCode === 200 ? success++ : errored++;
          list.push({
            name: 'Delly',
            success: res.statusCode === 200,
            data: res.json(),
          });
        })
        .catch((ex) => this.logger.warn('Unable to parse JSON [Delly]:', ex));
    }

    if (botlists.bfd !== undefined) {
      this.logger.info('Found Bots for Discord token, now posting...');

      const res = await this.http
        .request({
          method: 'POST',
          url: `https://botsfordiscord.com/api/bot/${this.discord.client.user.id}`,
          data: {
            server_count: this.discord.client.guilds.size,
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: botlists.bfd,
          },
        })
        .then((res) => {
          res.statusCode === 200 ? success++ : errored++;
          list.push({
            name: 'Bots for Discord',
            success: res.statusCode === 200,
            data: res.json(),
          });
        })
        .catch((ex) =>
          this.logger.warn('Unable to parse JSON [Bots for Discord]:', ex)
        );
    }

    const successRate = ((success / list.length) * 100).toFixed(2);
    this.logger.info(
      [
        `ℹ️ listly posted to ${list.length} botlists with a success rate of ${successRate}%`,
        'Serialized output will be displayed:',
      ].join('\n')
    );

    for (const botlist of list) {
      this.logger.info(
        `${botlist.success ? '✔' : '❌'} ${botlist.name}`,
        botlist.data
      );
    }
  }
}
