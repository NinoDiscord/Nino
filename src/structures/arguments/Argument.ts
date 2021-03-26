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

import type { CommandMessage } from '..';
import type CommandService from '../../services/CommandService';
import { NotInjectable } from '@augu/lilith';

export interface ArgumentInfo {
  optional?: boolean;
  default?: any;
  rest?: boolean;
  max?: number;
  type: string;
  name: string;
}

interface ArgumentResolveResult {
  error?: string;
  value?: any;
}

@NotInjectable()
export default class Argument {
  public service!: CommandService;
  public info: ArgumentInfo;

  constructor(info: ArgumentInfo) {
    this.info = {
      optional: info.optional ?? false,
      default: info.default ?? null,
      rest: info.rest ?? false,
      type: info.type,
      name: info.name,
      max: info.max
    };
  }

  get resolver() {
    return this.service.getArgumentResolver(this.info.type);
  }

  get format() {
    const prefix = this.info.optional === true ? '[' : '<';
    const suffix = this.info.optional === true ? ']' : '>';
    let text = `${prefix}${this.info.name}`;

    if (this.info.default !== null)
      text += ` = ${this.info.default}`;

    return (text += suffix, text);
  }

  // todo: make this more cleaner?
  async resolve(msg: CommandMessage, possible: string): Promise<ArgumentResolveResult> {
    if (possible.length === 0) {
      if (this.info.optional === false)
        return {
          error: `Argument **${this.info.name}** is required.`
        };

      return {
        value: this.info.default
      };
    }

    const validated = await this.resolver.validate(msg, possible, this);
    if (validated !== undefined)
      return { error: validated };

    try {
      const result = await this.resolver.parse(msg, possible, this);
      return { value: result };
    } catch(ex) {
      // todo: error handling?
      return { error: ex.message };
    }
  }
}
