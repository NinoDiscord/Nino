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

import { Component, Inject } from '@augu/lilith';
import { Client } from 'eris';
import { Logger } from 'tslog';
import Config from './Config';

export default class Discord implements Component {
  public mentionRegex!: RegExp;
  public priority: number = 1;
  public client!: Client;
  public name: string = 'Discord';

  @Inject
  private config!: Config;

  private logger: Logger = new Logger();

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
