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

import { execSync } from 'child_process';

/**
 * Returns the current version of Nino
 */
export const version: string = require('../../package.json').version;

/**
 * Returns the commit hash of the bot.
 */
export const commitHash: string | null = (() => {
  try {
    const hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    return hash.slice(0, 8);
  } catch {
    return null;
  }
})();

export const Color = 0xDAA2C6;

export const USERNAME_DISCRIM_REGEX = /^(.+)#(\d{4})$/;
export const USER_MENTION_REGEX = /<@!?([0-9]+)>/gi;
export const CHANNEL_REGEX = /<#([0-9]+)>/gi;
export const QUOTE_REGEX = /['"]/;
export const ROLE_REGEX = /^<@&([0-9]+)>/gi;
export const ID_REGEX = /\d{15,21}/;

/**
 * List of categories available to commands
 */
export const enum Categories {
  Moderation = 'moderation',
  Settings   = 'settings',
  General    = 'general',
  Owner      = 'owner'
}

/**
 * List of metadata keys for decorators
 */
export const enum MetadataKeys {
  Subcommand = '$nino::subcommands',
  Subscribe  = '$nino::subscriptions'
}
