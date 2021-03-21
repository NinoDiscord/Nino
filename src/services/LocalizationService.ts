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

import { Service, Inject } from '@augu/lilith';
import { Collection } from '@augu/collections';
import { readdir } from '@augu/utils';
import { Logger } from 'tslog';
import { join } from 'path';
import Locale from '../structures/Locale';
import Config from '../components/Config';

export default class LocalizationService implements Service {
  private defaultLocale!: Locale;
  public locales: Collection<string, Locale> = new Collection();
  public name: string = 'localization';

  @Inject
  private logger!: Logger;

  @Inject
  private config!: Config;

  async load() {
    this.logger.info('Loading in localization files...');

    const directory = join(process.cwd(), '..', 'locales');
    const files = await readdir(directory, {
      extensions: [/\.json$/]
    });

    if (!files.length) {
      this.logger.fatal('Missing localization files, did you clone the wrong commit?');
      process.exit(1);
    }

    for (let i = 0; i < files.length; i++) {
      const lang = require(files[i]);

      this.logger.info(`Found language ${lang.meta.full} (${lang.meta.code}) by ${lang.meta.translator}`);
      this.locales.set(lang.meta.code, new Locale(lang));
    }

    const defaultLocale = this.config.getProperty('defaultLocale') ?? 'en_US';
    this.logger.info(`Default localization language was set to ${defaultLocale}, applying...`);

    const locale = this.locales.find(locale => locale.code === defaultLocale);
    if (locale === null) {
      this.logger.fatal(`Localization "${defaultLocale}" was not found, defaulting to en_US...`);
      this.defaultLocale = this.locales.get('en_US')!;

      this.logger.warn(`Due to locale "${defaultLocale}" not being found and want to translate, read up on our translating guide:`);
    } else {
      this.logger.info(`Localization "${defaultLocale}" was found!`);
      this.defaultLocale = locale;
    }
  }

  /**
   * Gets the localization for the [CommandService], determined by the [guild] and [user]'s locale.
   * @param guild The guild's localization code
   * @param user The user's localization code
   */
  get(guild: string, user: string) {
    // this shouldn't happen but you never know
    if (!this.locales.has(guild) || !this.locales.has(user))
      return this.defaultLocale;

    // committing yanderedev over here
    if (user === this.defaultLocale.code && guild === this.defaultLocale.code)
      return this.locales.get(this.defaultLocale.code)!;
    else if (user !== this.defaultLocale.code && guild === this.defaultLocale.code)
      return this.locales.get(user)!;
    else if (guild !== this.defaultLocale.code && user === this.defaultLocale.code)
      return this.locales.get(guild)!;
    else
      return this.defaultLocale;
  }

  // returns the completed localization on all locales
  getCompletion(): { [x: string]: number } {
    return {};
  }
}
