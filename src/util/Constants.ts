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

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

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

export const SHORT_LINKS = JSON.parse<string[]>(
  readFileSync(join(process.cwd(), '..', 'assets', 'shortlinks.json'), 'utf8')
    .split(/\n\r?/)
    .join('\n')
);
export const Color = 0xdaa2c6;

export const USERNAME_DISCRIM_REGEX = /^(.+)#(\d{4})$/;
export const DISCORD_INVITE_REGEX =
  /(http(s)?:\/\/(www.)?)?(discord.gg|discord.io|discord.me|discord.link|invite.gg)\/\w+/;
export const USER_MENTION_REGEX = /^<@!?([0-9]+)>$/;
export const CHANNEL_REGEX = /<#([0-9]+)>$/;
export const QUOTE_REGEX = /['"]/;
export const ROLE_REGEX = /^<@&([0-9]+)>$/;
export const ID_REGEX = /^\d+$/;

/**
 * List of categories available to commands
 */
export enum Categories {
  Moderation = 'moderation',
  ThreadMod = 'thread moderation',
  VoiceMod = 'voice moderation',
  Settings = 'settings',
  Owner = 'owner',
  Core = 'core',
}

/**
 * List of metadata keys for decorators
 */
export const enum MetadataKeys {
  Subcommand = '$nino::subcommands',
  Subscribe = '$nino::subscriptions',
  APIRoute = '$nino::api-route',
}
