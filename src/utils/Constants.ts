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

// this is JUST to make Jest happy...
import { version as pkgVersion } from '../../package.json';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import memoize from './memoize';

/**
 * Returns the package version for Nino.
 */
export const version = pkgVersion;

/**
 * Returns the commit hash from the Git repository, if any.
 */
export const gitCommitHash = (() => {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim().slice(0, 8);
  } catch {
    return null;
  }
})();

const shortlinkPath =
  process.env.JEST && process.env.JEST === 'true'
    ? join(process.cwd(), 'assets', 'shortlinks.json')
    : join(process.cwd(), '..', 'assets', 'shortlinks.json');

/**
 * Returns the short links available in `assets/shortlinks.json`
 */
export const SHORT_LINKS = memoize<string[]>(readFileSync(shortlinkPath, 'utf-8').split(/\n\r?/));

/**
 * Returns the colour for embeds.
 */
export const Color = 0xeed7dd;

/**
 * Returns a list of the regular expressions Nino uses
 */
// eslint-disable-next-line
export namespace Regex {
  /**
   * `username#discrim` as a Regular Expression
   *
   * @example
   * ```js
   * const { Regex: { UsernameDiscrim } } = require('~/util/Constants');
   * 'August#5820'.match(UsernameDiscrim);
   * // => ['August#5820', 'August', '5820', index: 0, input: 'August#5820', groups: undefined]
   * ```
   */
  export const UsernameDiscrim = /^(.+)#(\d{4})$/;

  /**
   * Detects all the "discord" invites - this is really outdated.
   * @example
   * ```js
   * const { Regex: { DiscordInvite } } = require('~/util/Constants');
   * 'https://discord.gg/ATmjFH9kMH'.match(DiscordInvite);
   * // => [ 'https://discord.gg/ATmjFH9kMH', 'https://', 's', undefined, 'discord.gg', index: 0, input: 'https://discord.gg/ATmjFH9kMH', groups: undefined ]
   * ```
   */
  export const DiscordInvite = /(http(s)?:\/\/(www.)?)?(discord.gg|discord.io|discord.me|discord.link|invite.gg)\/\w+/;

  /**
   * Detects a user mention as `<@!280158289667555328>`
   * @example
   * ```js
   * const { Regex: { UserMention } } = require('~/util/Constants');
   * '<@!280158289667555328>'.match(UserMention);
   * // => ['<@!280158289667555328>', '280158289667555328', index: 0, input: '<@!280158289667555328>', groups: undefined]
   * ```
   */
  export const UserMention = /^<@!?([0-9]+)>$/;

  export const Channel = /<#([0-9]+)>$/;
  export const Quotes = /['"]/;
  export const Role = /^<@&([0-9]+)>$/;
  export const ID = /^\d+$/;
}

/**
 * Returns all the categories of a command.
 */
export enum CommandCategory {
  Admin = 'Administration',
  Core = 'Core',
  EasterEgg = 'Easter Eggs',
  Moderation = 'Moderation',
  System = 'System Administration',
  Threads = 'Thread Moderation',
  Voice = 'Voice Moderation',
}

/**
 * Returns a list of metadata keys available for reflection.
 */
export const enum MetadataKeys {
  Subcommand = 'nino.subcommands',
  Subscriber = 'nino.subscriber',
  Command = 'nino.command',
}
