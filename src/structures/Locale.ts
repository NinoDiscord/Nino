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

import { isObject } from '@augu/utils';

const NOT_FOUND_SYMBOL = Symbol.for('$nino::localization::not_found');

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

interface Localization {
  meta: LocalizationMeta;
  strings: {
    [x: string]: DeepPartial<string | string[] | Record<string, string | string[]>>;
  }
}

const KEY_REGEX = /[$]\{([\w\.]+)\}/g;

export default class Locale {
  public contributors: string[];
  public translator: string;
  public aliases: string[];
  public flag: string;
  public full: string;
  public code: string;

  #strings: Localization['strings'];

  constructor({ meta, strings }: Localization) {
    this.contributors = meta.contributors;
    this.translator   = meta.translator;
    this.#strings     = strings;
    this.aliases      = meta.aliases;
    this.flag         = meta.flag;
    this.full         = meta.full;
    this.code         = meta.code;
  }

  // todo: type safety?
  translate(key: string, args?: { [x: string]: any } | any[]) {
    const nodes = key.split('.');
    let value: any = this.#strings;

    for (const node of nodes) {
      try {
        value = value[node];
      } catch(ex) {
        value = NOT_FOUND_SYMBOL;
        break;
      }
    }

    if (value === NOT_FOUND_SYMBOL)
      throw new TypeError(`Node '${key}' doesn't exist...`);

    if (isObject(value))
      throw new TypeError(`Node '${key}' is a object!`);

    if (Array.isArray(value)) {
      return value.map(val => this.stringify(val, args)).join('\n');
    } else {
      return this.stringify(value, args);
    }
  }

  private stringify(value: any, rawArgs?: { [x: string]: any } | (string | number)[]) {
    // If no arguments are provided, best to assume to return the string
    if (!rawArgs)
      return value;

    // Convert it to a string
    if (typeof value !== 'string')
      value = String(value);

    let i = 0;
    const regex = Array.isArray(rawArgs) ? /%s|%d/g : KEY_REGEX;

    return (value as string).replace(regex, (_, key) => {
      if (Array.isArray(rawArgs)) {
        return String(rawArgs[i++]);
      } else {
        const value = String(rawArgs[key]);
        if (value === '')
          return '';
        else
          return value || '?';
      }
    });
  }
}
