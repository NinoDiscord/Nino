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

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * Simple cryptography library for user session tokens. Based on
 * [this stackoverflow](https://stackoverflow.com/q/48430224).
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace crypto {
  /**
   * The version for this cryptography utility
   */
  export const VERSION = 1;

  type TokenLike = `nino:v${typeof VERSION}.${string}`;
  export interface EncryptedData {
    token: TokenLike;
    key: string;
    tag: string;
    iv: string;
  }

  /**
   * Encrypts data and returns a object of `iv` and the token to store.
   * @param data The data to secure
   * @param secret The secret key
   */
  export function encrypt(data: any, secret: string): EncryptedData {
    const key = createHash('sha256').update(String(secret)).digest('hex').toString().substr(0, 32);
    const iv = randomBytes(64).toString('hex');
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const token = `nino:v${VERSION}.${encrypted}` as TokenLike;
    return {
      token,
      key,
      tag: cipher.getAuthTag().toString('hex'),
      iv
    };
  }

  export function isTokenLike(token: string): token is TokenLike {
    return typeof token === 'string' && token.startsWith(`nino:v${VERSION}.`);
  }

  export function decrypt<T extends object>({ token, key: secret, iv, tag }: EncryptedData) {
    if (!isTokenLike(token))
      throw new TypeError(`Token didn't start with "nino:v${VERSION}..."`);

    const decipher = createDecipheriv('aes-256-gcm', secret, iv);
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    const encrypted = token.replace(`nino:v${VERSION}.`, '');
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse<T>(decrypted);
  }
}
