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

import type { MiddlewareInterface, NextFn, ResolverData } from 'type-graphql';
import type { NinoContext } from '../API';
import { Logger } from 'tslog';
import Redis from '../../components/Redis';

export default class IsAuthorized implements MiddlewareInterface<NinoContext> {
  async use({ context }: ResolverData<NinoContext>, next: NextFn) {
    const redis = context.container.$ref<Redis>(Redis);
    const logger = context.container.$ref<Logger>(Logger);
    const header = context.req.headers['authorization'];

    if (!header)
      throw new TypeError('Missing `Authorization` header');

    if (!context.req.headers['x-nino-user-id'])
      throw new TypeError('Missing `X-Nino-User-Id` header');

    if (!header.startsWith('Bearer '))
      throw new TypeError('Authorization token must start with `Bearer ...`');

    const token = header.split(' ').pop();
    if (token === undefined)
      throw new TypeError('Expected token after `Bearer ...`, but got nothing.');

    const user = await redis.client.hget('nino:api:sessions', context.req.headers['x-nino-user-id'] as string)
      .then(value => value !== null ? JSON.parse<APITokenResult>(value) : null)
      .catch(() => null);

    if (user === null)
      throw new Error(`User with ID "${context.req.headers['x-nino-user-id']}" is not logged in.`);

    if (user.id !== context.req.headers['x-nino-user-id'] as string)
      throw new Error(`User "${context.req.headers['x-nino-user-id']}" is trying to access another user, not allowing.`);

    if (user.expiryDate > Date.now()) {
      logger.info(`User ${context.req.headers['x-nino-user-id']}'s token has expired`);
      await redis.client.hdel('nino:api:sessions', context.req.headers['x-nino-user-id'] as string);

      throw new Error('Session has expired, relogin.');
    }

    return next();
  }
}
