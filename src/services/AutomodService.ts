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

import { ComponentOrServiceHooks, Inject, Service } from '@augu/lilith';
import type { Member, Message, TextChannel, User } from 'eris';
import type { Automod } from '../structures';
import { Collection } from '@augu/collections';
import { Logger } from 'tslog';
import { join } from 'path';

@Service({
  priority: 1,
  children: join(process.cwd(), 'automod'),
  name: 'automod'
})
export default class AutomodService extends Collection<string, Automod> implements ComponentOrServiceHooks<Automod> {
  @Inject
  private logger!: Logger;

  onChildLoad(automod: Automod) {
    this.logger.info(`✔ Loaded automod ${automod.name}!`);
    this.set(automod.name, automod);
  }

  run(type: 'userUpdate', user: User): Promise<boolean>;
  run(type: 'memberNick', member: Member): Promise<boolean>;
  run(type: 'memberJoin', member: Member): Promise<boolean>;
  run(type: 'message', msg: Message<TextChannel>): Promise<boolean>;
  async run(type: string, ...args: any[]) {
    switch (type) {
      case 'userUpdate': {
        const automod = this.filter(am => am.onUserUpdate !== undefined);
        for (const am of automod) {
          const res = await am.onUserUpdate!(args[0]);
          if (res === true)
            return true;
        }

        return false;
      }

      case 'memberNick': {
        const automod = this.filter(am => am.onMemberNickUpdate !== undefined);
        for (const am of automod) {
          const res = await am.onMemberNickUpdate!(args[0]);
          if (res === true)
            return true;
        }

        return false;
      }

      case 'memberJoin': {
        const automod = this.filter(am => am.onMemberJoin !== undefined);
        for (const am of automod) {
          const res = await am.onMemberJoin!(args[0]);
          if (res === true)
            return true;
        }

        return false;
      }

      case 'message': {
        const automod = this.filter(am => am.onMessage !== undefined);
        for (const am of automod) {
          const res = await am.onMessage!(args[0]);
          if (res === true)
            return true;
        }

        return false;
      }

      default:
        return true;
    }
  }
}
