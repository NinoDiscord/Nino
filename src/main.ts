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

(require('@augu/dotenv') as typeof import('@augu/dotenv')).parse({
  populate: true,
  delimiter: ',',
  file: require('path').join(process.cwd(), '..', '.env'),
  schema: {
    NODE_ENV: {
      oneOf: ['production', 'development'],
      default: 'development',
      type: 'string',
    },
  },
});

import { commitHash, version } from './util/Constants';
import Discord from './components/Discord';
import Sentry from './components/Sentry';
import logger from './singletons/Logger';
import app from './container';
import Api from './api/API';
import ts from 'typescript';

(async () => {
  logger.info(`Loading Nino v${version} (${commitHash ?? '<unknown>'})`);
  logger.info(`-> TypeScript: ${ts.version}`);
  logger.info(`->    Node.js: ${process.version}`);
  if (process.env.REGION !== undefined) logger.info(`->     Region: ${process.env.REGION}`);

  try {
    await app.load();
    await import('./util/ErisPatch');
    await app.addComponent(Api);
  } catch (ex) {
    logger.fatal('Unable to load container');
    console.error(ex);
    process.exit(1);
  }

  logger.info('✔ Nino has started successfully');
  process.on('SIGINT', () => {
    logger.warn('Received CTRL+C call!');

    app.dispose();
    process.exit(0);
  });
})();

const ReconnectCodes = [
  1001, // Going Away (re-connect now)
  1006, // Connection reset by peer
];

const OtherPossibleReconnectCodes = [
  'WebSocket was closed before the connection was established',
  "Server didn't acknowledge previous heartbeat, possible lost connection",
];

process.on('unhandledRejection', (error) => {
  const sentry = app.$ref<Sentry>(Sentry);
  if (error !== null || error !== undefined) {
    logger.fatal('Received unhandled Promise rejection:', error);
    if (error instanceof Error) sentry?.report(error);
  }
});

process.on('uncaughtException', async (error) => {
  const sentry = app.$ref<Sentry>(Sentry);

  if ((error as any).code !== undefined) {
    if (ReconnectCodes.includes((error as any).code) || OtherPossibleReconnectCodes.includes(error.message)) {
      logger.fatal('Disconnected due to peer to peer connection ended, restarting client...');

      const discord = app.$ref<Discord>(Discord);
      discord.client.disconnect({ reconnect: false });
      await discord.client.connect();
    }
  } else {
    sentry?.report(error);
    logger.fatal('Uncaught exception has occured\n', error);
  }
});
