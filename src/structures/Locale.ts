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

import type { LocalizationStrings, LocalizationMeta } from '../@types/locale';
import { NotInjectable } from '@augu/lilith';

type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };

interface Localization {
  meta: LocalizationMeta;
  strings: {
    [x: string]: DeepPartial<string | string[] | Record<string, string | string[]>>;
  }
}

const KEY_REGEX = /[$]\{([\w\.]+)\}/g;

@NotInjectable()
export default class Locale {
  public contributors: string[];
  public translator: string;
  public aliases: string[];
  public flag: string;
  public full: string;
  public code: string;

  #strings: LocalizationStrings;

  constructor({ meta, strings }: Localization) {
    this.contributors = meta.contributors;
    this.translator   = meta.translator;
    this.#strings     = strings as any; // yes
    this.aliases      = meta.aliases;
    this.flag         = meta.flag;
    this.full         = meta.full;
    this.code         = meta.code;
  }

  translate(key: string, args?: { [x: string]: any } | any[]) {
    return 'blep';
  }
}
