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
  name: 'botlists'
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
      this.logger.warn('`botlists` is missing, please add it!');
      return Promise.resolve();
    }

    this.logger.info('Built scheduler for posting to botlists!');
    this.#interval = setInterval(this.post.bind(this), 86400000).unref();
  }

  dispose() {
    if (this.#interval)
      clearInterval(this.#interval);
  }

  async post() {
    const botlists = this.config.getProperty('botlists')!;
    if (botlists.dservices !== undefined) {
      this.logger.info('Found Discord Services token, now posting...');

      const res = await this.http.post({
        url: 'https://api.discordservices.net/bot/:client_id/stats',
        query: {
          client_id: this.discord.client.user.id
        },
        data: {
          server_count: this.discord.client.guilds.size
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: botlists.dservices
        }
      });

      const level = res.statusCode === 200 ? 'info' : 'warn';
      this.logger[level](`Posted statistics to Discord Services (${res.statusCode})`, res.json());
    }

    if (botlists.dboats !== undefined) {
      this.logger.info('Found Discord Boats token, now posting...');

      const res = await this.http.post('https://discord.boats/api/bot/:client_id', {
        query: {
          client_id: this.discord.client.user.id
        },
        data: {
          server_count: this.discord.client.guilds.size
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: botlists.dboats
        }
      });

      const level = res.statusCode === 200 ? 'info' : 'warn';
      this.logger[level](`Posted statistics to Discord Boats (${res.statusCode})`, res.json());
    }

    if (botlists.dbots !== undefined) {
      this.logger.info('Found Discord Bots token, now posting...');

      const res = await this.http.post('https://discord.bots.gg/api/v1/bots/:client_id/stats', {
        query: {
          client_id: this.discord.client.user.id
        },
        data: {
          shardCount: this.discord.client.shards.size,
          guildCount: this.discord.client.guilds.size
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: botlists.dbots
        }
      });

      const level = res.statusCode === 200 ? 'info' : 'warn';
      this.logger[level](`Posted statistics to Discord Bots (${res.statusCode})`, res.json());
    }

    if (botlists.topgg !== undefined) {
      this.logger.info('Found top.gg token, now posting...');

      const res = await this.http.post('https://top.gg/api/bots/:client_id/stats', {
        query: {
          client_id: this.discord.client.user.id
        },
        data: {
          server_count: this.discord.client.guilds.size,
          shard_count: this.discord.client.shards.size
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: botlists.topgg
        }
      });

      const level = res.statusCode === 200 ? 'info' : 'warn';
      this.logger[level](`Posted statistics to top.gg (${res.statusCode})`, res.json());
    }

    // Ice is a cute boyfriend btw <3
    if (botlists.delly !== undefined) {
      this.logger.info('Found Discord Extreme List token, now posting...');

      const res = await this.http.post('https://api.discordextremelist.xyz/v2/bot/:client_id/stats', {
        query: {
          client_id: this.discord.client.user.id
        },
        data: {
          guildCount: this.discord.client.guilds.size,
          shardCount: this.discord.client.shards.size
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: botlists.delly
        }
      });

      const level = res.statusCode === 200 ? 'info' : 'warn';
      this.logger[level](`Posted statistics to Discord Extreme List (${res.statusCode})`, res.json());
    }

    if (botlists.bfd !== undefined) {
      this.logger.info('Found Bots for Discord token, now posting...');

      const res = await this.http.post('https://botsfordiscord.com/api/bot/:client_id', {
        query: {
          client_id: this.discord.client.user.id
        },
        data: {
          server_count: this.discord.client.guilds.size
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: botlists.bfd
        }
      });

      const level = res.statusCode === 200 ? 'info' : 'warn';
      this.logger[level](`Posted statistics to Discord Extreme List (${res.statusCode})`, res.json());
    }
  }
}
