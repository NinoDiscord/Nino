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

import { USER_MENTION_REGEX, USERNAME_DISCRIM_REGEX, ID_REGEX, CHANNEL_REGEX, ROLE_REGEX } from '../util/Constants';
import { Client, User, Guild, AnyChannel } from 'eris';
import { Component, Inject } from '@augu/lilith';
import { Logger } from 'tslog';
import Config from './Config';

export default class Discord implements Component {
  public mentionRegex!: RegExp;
  public priority: number = 1;
  public client!: Client;
  public name: string = 'Discord';

  @Inject
  private config!: Config;

  @Inject
  private logger!: Logger;

  load() {
    if (this.client !== undefined) {
      this.logger.warn('A client has already been created.');
      return;
    }

    const token = this.config.getProperty('token');
    if (token === undefined) {
      this.logger.fatal('Property `token` doesn\'t exist in the config file, please populate it.');
      return;
    }

    this.logger.info('Booting up the bot...');
    this.client = new Client(token, {
      getAllUsers: true,
      maxShards: 'auto',
      restMode: true,
      intents: [
        'guilds',
        'guildBans',
        'guildMembers',
        'guildMessages'
      ]
    });

    this.client.on('ready', () => {
      this.logger.info(`Connected as ${this.client.user.username}#${this.client.user.discriminator} (ID: ${this.client.user.id})`);
      this.logger.info(`Guilds: ${this.client.guilds.size.toLocaleString()} | Users: ${this.client.users.size.toLocaleString()}`);

      this.mentionRegex = new RegExp(`^<@!?${this.client.user.id}> `);

      const prefixes = this.config.getProperty('prefixes') ?? ['x!'];
      this.client.editStatus('online', {
        name: `${prefixes[Math.floor(Math.random() * prefixes.length)]}help in ${this.client.guilds.size.toLocaleString()} Guilds`,
        type: 2
      });
    });

    this
      .client
      .on('shardReady', this.onShardReady.bind(this))
      .on('shardDisconnect', this.onShardDisconnect.bind(this))
      .on('shardResume', this.onShardResume.bind(this));

    return this.client.connect();
  }

  dispose() {
    return this.client.disconnect({ reconnect: false });
  }

  async getUser(query: string) {
    if (USER_MENTION_REGEX.test(query)) {
      const match = query.match(USER_MENTION_REGEX)!;
      if (match === null)
        return null;

      const user = this.client.users.get(match[1]);
      if (user !== undefined)
        return user;
    }

    if (USERNAME_DISCRIM_REGEX.test(query)) {
      const match = query.match(USERNAME_DISCRIM_REGEX)!;
      const users = this.client.users.filter(user =>
        user.username === match[1] && Number(user.discriminator) === Number(match[2])
      );

      // TODO: pagination?
      if (users.length > 0)
        return users[0];
    }

    if (ID_REGEX.test(query)) {
      const user = this.client.users.get(query);
      if (user !== undefined)
        return user;
      else
        return this.client.getRESTUser(query);
    }

    return null;
  }

  getChannel(query: string, guild?: Guild) {
    return new Promise<AnyChannel | null>(resolve => {
      if (ID_REGEX.test(query)) {
        if (guild) {
          return resolve(guild.channels.has(query) ? guild.channels.get(query)! : null);
        } else {
          const channel = query in this.client.channelGuildMap && this.client.guilds.get(this.client.channelGuildMap[query])?.channels.get(query);
          return resolve(channel || null);
        }
      }

      if (CHANNEL_REGEX.test(query)) {
        const match = query.match(CHANNEL_REGEX)!;
        if (guild) {
          return resolve(guild.channels.has(match[1]) ? guild.channels.get(match[1])! : null);
        } else {
          const channel = match[1] in this.client.channelGuildMap && this.client.guilds.get(this.client.channelGuildMap[match[1]])?.channels.get(match[1]);
          return resolve(channel || null);
        }
      }

      if (guild !== undefined) {
        const channels = guild.channels.filter(chan => chan.name.toLowerCase().includes(query.toLowerCase()));
        if (channels.length > 0)
          return resolve(channels[0]);
      }

      resolve(null);
    });
  }

  private onShardReady(id: number) {
    this.logger.info(`Shard #${id} is now ready.`);
  }

  private onShardDisconnect(error: any, id: number) {
    this.logger.fatal(`Shard #${id} has disconnected from the universe`, error || new Error('Connection has been reset by peer'));
  }

  private onShardResume(id: number) {
    this.logger.info(`Shard #${id} has resumed it's connection!`);
  }
}
