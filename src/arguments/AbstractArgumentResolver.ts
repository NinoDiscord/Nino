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

import type { CommandMessage } from '../structures';
import Discord from '../components/Discord';

/**
 * Type alias to determine if {@link T} extends a Function which returns a {@link Promise}.
 */
export type IsThenable<T> = T extends (...args: any[]) => Promise<unknown> ? true : false;

/**
 * Represents a resolver to transform a string argument into a value that is
 * type-checked at runtime.
 */
export abstract class AbstractArgumentResolver<T> {
  /**
   * Returns the Discord client for this resolver. This shouldn't be used
   * outside of the resolvers.
   */
  readonly discord: Discord = app.$ref(Discord);

  /**
   * Creates a new instance of this {@link AbstractArgumentResolver}.
   * @param id The ID of this argument resolver.
   */
  constructor(public id: string) {}

  /**
   * Validates the input from the argument and returns a {@link boolean}.
   */
  abstract validate(msg: CommandMessage, arg: any, value: string): boolean | Promise<boolean>;

  /**
   * Parses the {@link value} of this resolver and returns a instance of {@link T}.
   * @param msg The message context
   * @param arg The argument context
   * @param value The value of the argument
   */
  abstract parse(msg: CommandMessage, arg: any, value: string): T | Promise<T>;
}
