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

import { ArgumentType } from './Argument';

/**
 * Represents a lexical token, which is performed by the argument consumer.
 */
interface Token {
  defaultValue?: any;
  optional?: boolean;
  multi?: boolean;
  rest?: boolean;
  type: ArgumentType;
  name: string;
}

/**
 * Creates a lexical token.
 */
function createToken(name: string, type: ArgumentType, tokenOpts?: Omit<Token, 'name' | 'type'>): Token {
  return {
    name,
    type,
    ...(tokenOpts ?? {}),
  } as Token;
}

/**
 * Represents the consumer to consume argument tokens to transform
 * the value into a value from any {@link AbstractArgumentResolver}s.
 */
export default class ArgumentConsumer {
  /**
   * Returns the formed argument list.
   */
  #formed: Record<string, any> = {};

  /**
   * Creates a new {@link ArgumentConsumer} instance.
   * @param usageString The usage string
   */
  constructor(private usageString: string) {}

  /**
   * Consumes all tokens from the `usageString` and returns a instance
   * of {@link T}, which is casted from ArgumentConsumer#formed.
   */
  parse<T extends Record<string, any>>(): T {
    return this.#formed as T;
  }
}
