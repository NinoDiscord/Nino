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

import { commitHash, version } from './util/Constants';
import Discord from './components/Discord';
import logger from './singletons/Logger';
import app from './container';
import ts from 'typescript';

(async() => {
  logger.info(`Loading Nino v${version} (${commitHash ?? '<unknown>'})`);
  logger.info(`-> TypeScript: ${ts.version}`);
  logger.info(`->    Node.js: ${process.version}`);
  if (process.env.REGION !== undefined)
    logger.info(`->     Region: ${process.env.REGION}`);

  try {
    await app.load();
  } catch(ex) {
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
  1006  // Connection reset by peer
];

process.on('unhandledRejection', error => logger.fatal('Unhandled promise rejection has occured\n', (error as any).stack ?? '(none provided)'));
process.on('uncaughtException', async error => {
  if ((error as any).code !== undefined && ReconnectCodes.includes((error as any).code)) {
    logger.fatal('Disconnected due to peer to peer connection ended, restarting client...');

    const discord = app.$ref<Discord>(Discord);
    discord.client.disconnect({ reconnect: false });
    await discord.client.connect();
  } else {
    logger.fatal('Uncaught exception has occured\n', error);
  }
});
