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

/**
 * Returns a list of serializable arguments available.
 */
export type Serializable = 'guild:case' | 'member' | 'string' | 'text:channel' | 'user' | 'time';

/**
 * Represents the information for constructing {@link Argument Arguments}.
 */
export interface ArgumentInfo {
  serializers: Serializable[] | Serializable;
  isRequired?: boolean;
  isMulti?: boolean;
  isRest?: boolean;
  oneOf?: any[];
  name: string;
}

/**
 * Represents an Argument that is consumed using the Argument
 */
export default class Argument {
  /**
   * Returns the list of serializers this {@link Argument} should use.
   */
  serializers: string[];

  /**
   * If the user should provide this {@link Argument}.
   */
  required: boolean;

  /**
   * If the user can provide multiple fields for this {@link Argument}.
   */
  multi: boolean;

  /**
   * If this argument is infinite as the input of this {@link Argument}. Rest
   * arguments should be the last argument to be consumed.
   */
  rest: boolean;

  /**
   * The name of the argument
   */
  name: string;

  /**
   * Constructs a new {@link Argument}.
   */
  constructor({ isMulti, isRequired, isRest, serializers, name }: Required<ArgumentInfo>) {
    this.serializers = Array.isArray(serializers) ? serializers : [serializers];
    this.required = isRequired;
    this.multi = isMulti;
    this.rest = isRest;
    this.name = name;
  }

  /**
   * Returns a simple format the user can read.
   */
  get format() {
    const types = this.serializers
      .map((s, i) => (this.serializers.length > 1 && i + 1 === this.serializers.length ? `or ${s}` : s))
      .join(', ');

    return `${this.name}: ${types}${this.rest ? '...' : ''}`;
  }
}
