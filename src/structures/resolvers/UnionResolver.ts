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

import type CommandService from '../../services/CommandService';
import ArgumentResolver from '../arguments/ArgumentResolver';
import type Argument from '../arguments/Argument';
import CommandMessage from '../CommandMessage';

export default class UnionResolver extends ArgumentResolver<any> {
  private types: ArgumentResolver<any>[] = [];

  constructor(private service: CommandService, id: string) {
    super(id);

    const ids = id.split(' | ');
    for (const id of ids) {
      if (!this.service.resolvers.has(id))
        throw new TypeError(`Resolver with id "${id}" doesn't exist`);

      this.types.push(this.service.resolvers.get(id)!);
    }
  }

  async validate(msg: CommandMessage, possible: string, arg: Argument) {
    let results = this.types.map(type => type.validate(msg, possible, arg));
    results = await Promise.all(results);

    if (results.some(r => r && typeof r === 'string'))
      return results.filter(r => r && typeof r === 'string').join('\n');
  }

  async parse(msg: CommandMessage, possible: string, arg: Argument) {
    let results = this.types.map(type => type.validate(msg, possible, arg));
    results = await Promise.all(results);

    for (let i = 0; i < results.length; i++) {
      if (results[i] && typeof results[i] !== 'string')
        return this.types[i].parse(msg, possible, arg);
    }

    throw new TypeError(`Unable to parse value "${possible}" with union literal "${this.id}"`);
  }
}
