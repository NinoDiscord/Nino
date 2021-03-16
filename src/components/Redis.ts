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
import { Logger } from 'tslog';
import IORedis from 'ioredis';
import Config from './Config';

export default class Redis implements Component {
  private client!: IORedis.Redis;
  public priority: number = 1;
  public name: string = 'Redis';

  private logger: Logger = new Logger();

  @Inject
  private config!: Config;

  async load() {
    this.logger.info('Connecting to Redis...');
    this.client = new IORedis({
      lazyConnect: true,
      enableReadyCheck: true,
      connectionName: 'Nino',
      password: this.config.getProperty('redis.password'),
      host: this.config.getProperty('redis.host'),
      port: this.config.getProperty('redis.port'),
      db: this.config.getProperty('redis.index')
    });

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
}
