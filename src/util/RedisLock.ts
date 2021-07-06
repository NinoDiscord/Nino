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

import { createLock } from 'ioredis-lock';
import { Inject } from '@augu/lilith';
import { Logger } from 'tslog';
import logger from '../singletons/Logger';
import Redis from '../components/Redis';

/**
 * Represents a lock on a Redis resource.
 */
export default class RedisLock {
  @Inject
  private readonly redis!: Redis;

  private logger!: Logger;
  private lock?: ReturnType<typeof createLock>;

  /**
   * Statically create a {@link RedisLock} with the {@link Redis} component attached
   * to this resource.
   */
  static create() {
    const lock = new RedisLock();
    app.addInjections(lock);

    return lock;
  }

  /**
   * Creates a new instance of this {@link RedisLock}.
   */
  constructor() {
    this.logger = logger.getChildLogger({ name: 'Nino: RedisLock' });
  }

  /**
   * Creates a new Lock for this {@link RedisLock}.
   */
  async acquire(key: string) {
    this.logger.info(`Creating lock for key "${key}"...`);
    this.lock = createLock(this.redis.client, { timeout: 5000 }); // Set it to 20 seconds

    await this.lock.acquire(`nino:${key}`);
  }

  /**
   * Releases this lock and destroys the current lock.
   */
  async release() {
    this.logger.warn('Destroyed lock.');

    await this.lock?.release();
    this.lock = undefined;
  }

  /**
   * Extends the lock.
   */
  async extend(key: string) {
    this.logger.warn(`Extending time for key "${key}"...`);
    await this.lock?.extend(5000); // Extend it for another 10 seconds
  }
}
