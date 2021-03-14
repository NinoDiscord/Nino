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

import { Component } from '@augu/lilith';
import { Client } from 'eris';
import { Logger } from 'tslog';

export default class Discord implements Component {
  public priority: number = 1;
  public client!: Client;
  public name: string = 'Discord';

  private logger: Logger = new Logger();

  load() {
    if (this.client !== undefined) {
      this.logger.warn('A client has already been created.');
      return;
    }

    this.logger.info('Booting up the bot...');
    this.client = new Client('some token', {
      getAllUsers: true,
      maxShards: 'auto',
      restMode: true,
      intents: [
        'guilds',
        'guildBans',
        'guildMembers',
        'guildMessages'
      ]
    });

    return this.client.connect()
      .then(() => {
        this.logger.info('Connecting to Discord!');
        this.client.editStatus('idle', {
          name: 'to waves of websockets... ✨',
          type: 2
        });
      });
  }

  dispose() {
    return this.client.disconnect({ reconnect: false });
  }
}
