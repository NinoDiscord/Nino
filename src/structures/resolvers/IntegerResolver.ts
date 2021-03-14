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

import type CommandMessage from '../CommandMessage';
import ArgumentResolver from '../arguments/ArgumentResolver';
import type Argument from '../arguments/Argument';

export default class IntegerResolver extends ArgumentResolver<number> {
  constructor() {
    super('int');
  }

  validate(_: CommandMessage, possible: string, arg: Argument) {
    const value = Number.parseInt(possible);
    if (Number.isNaN(value))
      return 'The number you provided was not a number.';

    if (arg.info.max !== undefined && value > arg.info.max)
      return `Value \`${value}\` has to be lower or equal to \`${arg.info.max}\`.`;
  }

  parse(_: CommandMessage, possible: string) {
    return Number.parseInt(possible);
  }
}
