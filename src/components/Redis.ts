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
import type { Timeout } from './timeouts/types';
import { Stopwatch } from '@augu/utils';
import { Logger } from 'tslog';
import IORedis from 'ioredis';
import Config from './Config';

@Component({
  priority: 4,
  name: 'redis'
})
export default class Redis {
  public client!: IORedis.Redis;

  @Inject
  private logger!: Logger;

  @Inject
  private config!: Config;

  async load() {
    this.logger.info('Connecting to Redis...');

    const sentinels = this.config.getProperty('redis.sentinels');
    const password = this.config.getProperty('redis.password');
    const masterName = this.config.getProperty('redis.master');
    const index = this.config.getProperty('redis.index');
    const host = this.config.getProperty('redis.host');
    const port = this.config.getProperty('redis.port');

    const config = (sentinels ?? []).length > 0 ? {
      enableReadyCheck: true,
      connectionName: 'Nino',
      lazyConnect: true,
      sentinels,
      password: password,
      name: masterName,
      db: index
    } : {
      enableReadyCheck: true,
      connectionName: 'Nino',
      lazyConnect: true,
      password: password,
      host: host,
      port: port,
      db: index
    };

    this.client = new IORedis(config);

    await this.client.client('SETNAME', 'Nino');
    this.client.on('ready', () =>
      this.logger.info('Connected to Redis!')
    );

    this.client.on('error', this.logger.error);
    return this.client.connect().catch(() => {}); // eslint-disable-line
  }

  dispose() {
    return this.client.disconnect();
  }

  getTimeouts(guild: string) {
    return this.client.hget('nino:timeouts', guild)
      .then(value => value !== null ? JSON.parse<Timeout[]>(value) : [])
      .catch(() => [] as Timeout[]);
  }

  async getStatistics() {
    const stopwatch = new Stopwatch();
    stopwatch.start();
    await this.client.ping('Ice is cute as FUCK');

    const ping = stopwatch.end();

    // stole this from donny
    // Credit: https://github.com/FurryBotCo/FurryBot/blob/master/src/commands/information/stats-cmd.ts#L22
    const [stats, server] = await Promise.all([
      this.client.info('stats').then(info =>
        info
          .split(/\n\r?/)
          .slice(1, -1)
          .map(item => ({ [item.split(':')[0]]: item.split(':')[1].trim() }))
          .reduce((a, b) => ({ ...a, ...b })) as unknown as RedisInfo
      ),

      this.client.info('server').then(info =>
        info
          .split(/\n\r?/)
          .slice(1, -1)
          .map(item => ({ [item.split(':')[0]]: item.split(':')[1].trim() }))
          .reduce((a, b) => ({ ...a, ...b })) as unknown as RedisServerInfo
      )
    ]);

    return {
      server,
      stats,
      ping
    };
  }
}
