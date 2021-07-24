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

import { QUOTE_REGEX } from './Constants';

/**
 * Iterator function to provide a tuple of `[index, item]` in a Array.
 * @param arr The array to run this iterator function
 * @example
 * ```ts
 * const arr = ['str', 'uwu', 'owo'];
 * for (const [index, item] of withIndex(arr)) {
 *    console.log(`${index}: ${item}`);
 *    // prints out:
 *    // 0: str
 *    // 1: uwu
 *    // 2: owo
 * }
 * ```
 */
export function* withIndex<T extends any[]>(
  arr: T
): Generator<[index: number, item: T[any]]> {
  for (let i = 0; i < arr.length; i++) {
    yield [i, arr[i]];
  }
}

export function formatSize(bytes: number) {
  const kilo = bytes / 1024;
  const mega = kilo / 1024;
  const giga = mega / 1024;

  if (kilo < 1024) return `${kilo.toFixed(1)}KB`;
  else if (kilo > 1024 && mega < 1024) return `${mega.toFixed(1)}MB`;
  else return `${giga.toFixed(1)}GB`;
}

// credit: Ice (https://github.com/IceeMC)
export function getQuotedStrings(content: string) {
  const parsed: string[] = [];
  let curr = '';
  let opened = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === ' ' && !opened) {
      opened = false;
      if (curr.length > 0) parsed.push(curr);

      curr = '';
    }

    if (QUOTE_REGEX.test(char)) {
      if (opened) {
        opened = false;
        if (curr.length > 0) parsed.push(curr);

        curr = '';
        continue;
      }

      opened = true;
      continue;
    }

    if (!opened && char === ' ') continue;
    curr += char;
  }

  if (curr.length > 0) parsed.push(curr);
  return parsed;
}
