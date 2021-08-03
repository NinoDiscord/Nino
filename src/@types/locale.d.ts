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

/* eslint-disable camelcase */

export {};
/** */
declare global {
  /**
   * Metadata for a locale, this is used in the "meta" object
   */
  interface LocalizationMeta {
    /** List of contributors (by user ID) who helped translate or fix minor issues with this Locale */
    contributors: string[];

    /** The translator's ID */
    translator: string;

    /** Any additional aliases to use when setting or resetting a locale */
    aliases: string[];

    /** The flag's emoji (example: `:flag_us:`) */
    flag: string;

    /** The full name of the Locale (i.e `English (UK)`) */
    full: string;

    /** The locale's code (i.e `en_US`) */
    code: string;
  }

  interface LocalizationStrings {
    descriptions: LocalizationStrings.Descriptions;
    commands: LocalizationStrings.Commands;
    automod: LocalizationStrings.Automod;
    generic: LocalizationStrings.Generic;
    errors: LocalizationStrings.Errors;
  }

  namespace LocalizationStrings {
    export interface Descriptions {
      // Unknown
      unknown: string;

      // Core
      help: string;
      invite: string;
      locale: string;
      ping: string;
      shardinfo: string;
      source: string;
      statistics: string;
      uptime: string;

      // Moderation
      ban: string;
      case: string;
      kick: string;
      mute: string;
      pardon: string;
      purge: string;
      reason: string;
      softban: string;
      timeouts: string;
      unban: string;
      unmute: string;
      warn: string;
      warnings: string;
      voice_mute: string;
      voice_deafen: string;
      voice_undeafen: string;
      voice_unmute: string;

      // Settings
      automod: string;
      logging: string;
      modlog: string;
      muted_role: string;
      prefix: string;
      punishments: string;
    }

    export interface Commands {
      help: {
        embed: {
          title: string;
          description: string[];
          fields: {
            moderation: string;
            core: string;
            settings: string;
          };
        };

        command: {
          not_found: string;
          embed: {
            title: string;
            description: string;
            fields: {
              syntax: string;
              category: string;
              aliases: string;
              owner_only: string;
              cooldown: string;
              user_perms: string;
              bot_perms: string;
              examples: string;
            };
          };
        };

        module: {
          embed: {
            title: string;
          };
        };

        usage_title: string;
        usage: string[];
      };

      invite: string[];
    }

    export interface Automod {
      blacklist: string;
      invites: string;
      mentions: string;
      shortlinks: string;
      spam: string;
      raid: Record<'locked' | 'unlocked', string>;
    }

    // eslint-disable-next-line
    export interface Generic {}

    // eslint-disable-next-line
    export interface Errors {}
  }
}
