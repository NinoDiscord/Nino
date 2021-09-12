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

import Argument, { ArgumentInfo } from './Argument';
import type ArgumentSerializer from './ArgumentSerializer';
import { Collection } from '@augu/collections';

/**
 * Represents the consumer for consuming user input and returning
 * as {@link Argument} variables.
 */
export default class ArgumentConsumer {
  /**
   * Returns the serializers avalialble in this {@link ArgumentConsumer}.
   */
  serializers: Collection<ArgumentSerializer<unknown>> = new Collection([]);

  /**
   * Returns the arguments this {@link ArgumentConsumer} is for.
   */
  arguments: Argument[];

  /**
   * Creates a new {@link ArgumentConsumer} instance.
   * @param args The list of arguments to use
   */
  constructor(args: ArgumentInfo[]) {
    this.arguments = new Array(args.length);

    let isRest = false;
    let isOptional = false;
    let isMulti = false;
    let isRequired = false;

    for (let i = 0; i < args.length; i++) {
      if (isRest) throw new Error('Rest arguments cannot go after newer arguments.');

      isOptional = args[i].isRequired === false;
      isRequired = !isOptional;
      isMulti = args[i].isMulti === true;
      isRest = args[i].isRest === true;

      if (isRequired && isOptional) throw new Error('Required arguments cannot come after optional ones.');
      this.arguments[i] = new Argument({
        isMulti,
        isRequired,
        isRest,
        name: args[i].name,
        serializers: args[i].serializers,
        oneOf: args[i].oneOf ?? [],
      });
    }
  }

  /**
   * Parses a list of {@link args arguments} to a {@link Record} of arguments available.
   * @param args The arguments to consume over
   * @returns The argument record to use.
   */
  parse(args: string[]): Record<string, unknown> {
    return {};
  }
}
