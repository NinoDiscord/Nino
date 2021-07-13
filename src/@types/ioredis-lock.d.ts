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

/** */
declare module 'ioredis-lock' {
  import * as ioredis from 'ioredis';

  interface RedisLockOptions {
    timeout?: number;
    retries?: number;
    delay?: number;
  }

  /**
   * Creates and returns a new Lock instance, configured for use with the supplied redis client, as well as options, if provided.
   * The options object may contain following three keys, as outlined at the start of the documentation: timeout, retries and delay.
   */
  export function createLock(client: ioredis.Redis | ioredis.Cluster, options?: RedisLockOptions): Lock;

  /**
   * Returns an array of currently active/acquired locks.
   */
  export function getAcquiredLocks(): Promise<Lock[]>;

  /**
   * The constructor for a LockAcquisitionError. Thrown or returned when a lock
   * could not be acquired.
   */
  export class LockAcquisitionError extends Error {
    constructor(message: string);
  }

  /**
   * The constructor for a LockReleaseError. Thrown or returned when a lock
   * could not be released.
   */
  export class LockReleaseError extends Error {
    constructor(message: string);
  }

  /**
   * The constructor for a LockExtendError. Thrown or returned when a lock
   * could not be extended.
   */
  export class LockExtendError extends Error {
    constructor(message: string);
  }

  /**
   * The constructor for a Lock object. Accepts both a redis client, as well as
   * an options object with the following properties: timeout, retries and delay.
   * Any options not supplied are subject to the current defaults.
   */
  export class Lock {
    public readonly config: RedisLockOptions;

    /**
     * Attempts to acquire a lock, given a key, and an optional callback function.
     * If the initial lock fails, additional attempts will be made for the
     * configured number of retries, and padded by the delay. The callback is
     * invoked with an error on failure, and returns a promise if no callback is
     * supplied. If invoked in the context of a promise, it may throw a
     * LockAcquisitionError.
     *
     * @param key The redis key to use for the lock
     */
    public acquire(key: string): Promise<Lock>;

    /**
     * Attempts to extend the lock
     * @param expire in `timeout` seconds
     */
    public extend(expire: number): Promise<Lock>;

    /**
     * Attempts to release the lock, and accepts an optional callback function.
     * The callback is invoked with an error on failure, and returns a promise
     * if no callback is supplied. If invoked in the context of a promise, it may
     * throw a LockReleaseError.
     */
    public release(): Promise<Lock>;
  }
}
