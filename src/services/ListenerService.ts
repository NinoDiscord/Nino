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

import { Service, Inject, getInjectables } from '@augu/lilith';
import { getSubscriptionsIn } from '../structures/decorators/Subscribe';
import { readdirSync, Ctor } from '@augu/utils';
import { Collection } from '@augu/collections';
import { Logger } from 'tslog';
import { join } from 'path';
import Discord from '../components/Discord';
import app from '../container';

export default class ListenerService implements Service {
  public events: Collection<string, any> = new Collection();
  public name = 'Listeners';

  @Inject
  private logger!: Logger;

  @Inject
  private discord!: Discord;

  async load() {
    this.logger.info('Initializing all event listeners...');

    const files = readdirSync(join(__dirname, '..', 'listeners'));
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ctor: Ctor<any> = await import(file);
      const listener = new ctor.default!();

      app.inject(getInjectables(listener), listener);

      const subscriptions = getSubscriptionsIn(listener);
      for (const sub of subscriptions) {
        const handler = sub.run.bind(listener);
        this.discord.client.on(sub.event, async (...args: any[]) => {
          try {
            await handler(...args);
          } catch(ex) {
            this.logger.error(`Unable to handle event ${sub.event}:`, ex);
          }
        });
      }

      this.events.set(listener.constructor.name.replace('Guild', '').replace('Listener', '').trim().toLowerCase(), listener);
      this.logger.info(`Initialized ${subscriptions.length} events on listener (${subscriptions.map(r => r.event).join(', ')})`);
    }
  }
}
