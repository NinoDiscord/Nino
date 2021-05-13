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

    const redis = this.config.getProperty('redis')!;
    const config = (redis.sentinels ?? []).length > 0 ? {
      enableReadyCheck: true,
      connectionName: 'Nino',
      lazyConnect: true,
      sentinels: redis.sentinels,
      password: redis.password,
      master: redis.master,
      db: redis.index
    } : {
      enableReadyCheck: true,
      connectionName: 'Nino',
      lazyConnect: true,
      password: redis.password,
      host: redis.host,
      port: redis.port,
      db: redis.index
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
}
