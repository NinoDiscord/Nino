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

const NotFoundSymbol = Symbol('nino.localication.not-found');
const KEY_REGEX = /[$]\{([\w\.]+)\}/g;

/**
 * Represents a language object to translate messages. Locales can be found in
 * the root directory + `/locales`.
 */
export default class Language {
  /**
   * All the contributors who translated this language, omitting the author.
   */
  contributors: string[];

  /**
   * The translator who translated this language.
   */
  translator: string;

  /**
   * Different aliases to set your locale to.
   */
  aliases: string[];

  /**
   * The flags in emoji form (i.e, `:flag_us:` for **English (US)**
   */
  flag: string;

  /**
   * The name of the locale.
   */
  full: string;

  /**
   * The language code to determine this language as
   */
  code: string;

  // List of strings to translate from.
  private strings: LocalizationStrings;

  constructor({ meta, strings }: { meta: LocalizationMeta; strings: LocalizationStrings }) {
    this.contributors = meta.contributors;
    this.translator = meta.translator;
    this.aliases = meta.aliases;
    this.strings = strings;
    this.flag = meta.flag;
    this.full = meta.full;
    this.code = meta.code;
  }

  /**
   * Translates a message from its {@link key} (with additional {@link args arguments}) to return a localised
   * version of the message.
   *
   * @param key The message key to translate
   * @param args
   */
  translate<K extends ObjectKeysWithSeperator<LocalizationStrings>, R = KeyToPropType<LocalizationStrings, K>>(
    key: K,
    args?: Record<string, any>
  ): R extends string[] ? string : string {
    const nodes = key.split('.');
    let value: any = this.strings;

    for (let i = 0; i < nodes.length; i++) {
      try {
        value = nodes[i];
      } catch (ex) {
        const e = ex as Error;
        if (e.message.includes('of undefined')) value = NotFoundSymbol;

        break;
      }
    }

    if (value === undefined || value === NotFoundSymbol)
      throw new TypeError(`Message node '${key}' does not exist in the localisation tree.`);

    if (isObject(value)) throw new TypeError(`Message node '${key}' is a object, maybe narrow it down a bit...?`);

    return Array.isArray(value)
      ? value.map((val) => this.#stringify(val, args)).join('\n')
      : this.#stringify(value, args);
  }

  #stringify(value: any, rawArgs?: Record<string, any>) {
    if (!rawArgs) return value;
    if (typeof value !== 'string') value = String(value);

    return (<string>value).replace(KEY_REGEX, (_, key) => (String(rawArgs[key]) === '' ? '?' : value || '?'));
  }
}
