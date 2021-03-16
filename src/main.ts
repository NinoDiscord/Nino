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

import 'source-map-support/register';
import 'reflect-metadata';

import app from './container';
import { getInjectables } from '@augu/lilith';
import { Logger } from 'tslog';
import CommandService from './services/CommandService';
import ListenerService from './services/ListenerService';

const logger = new Logger();

const applyInjections = () => {
  logger.info('Applying injections in commands and listeners...');
  // @ts-expect-error (we expect it but type-cast it to A INSTANCE of it!)
  const commands = app.$ref<CommandService>(CommandService);

  // @ts-expect-error
  const listeners = app.$ref<ListenerService>(ListenerService);

  for (const command of commands.commands.values()) {
    const injections = getInjectables(command);
    app.inject(injections, command);
  }

  for (const listener of listeners.events.values()) {
    const injections = getInjectables(listener);
    app.inject(injections, listener);
  }

  logger.info('Added injectables!');
};

(async() => {
  logger.info('Verifying application state...');
  try {
    await app.verify();
  } catch(ex) {
    logger.fatal('Unable to verify application state');
    console.error(ex);
    process.exit(1);
  }

  logger.info('Application state has been verified! :D');
  applyInjections();

  process.on('SIGINT', () => {
    logger.warn('Received CTRL+C call!');

    app.dispose();
    process.exit(0);
  });
})();
