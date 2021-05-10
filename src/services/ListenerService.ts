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

import { getSubscriptionsIn } from '../structures/decorators/Subscribe';
import { Service, Inject } from '@augu/lilith';
import { Logger } from 'tslog';
import { join } from 'path';
import Discord from '../components/Discord';

@Service({
  priority: 0,
  children: join(process.cwd(), 'listeners'),
  name: 'listeners'
})
export default class ListenerService {
  @Inject
  private logger!: Logger;

  @Inject
  private discord!: Discord;

  onChildLoad(listener: any) {
    const subscriptions = getSubscriptionsIn(listener);
    for (let i = 0; i < subscriptions.length; i++) {
      const sub = subscriptions[i];
      const handler = sub.run.bind(listener);

      this.discord.client.on(sub.event, async (...args: any[]) => {
        try {
          await handler(...args);
        } catch(ex) {
          this.logger.error(`Unable to handle event ${sub.event}`, ex);
        }
      });

      this.logger.info(`✔ Loaded event ${sub.event}`);
    }
  }
}
