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

import { resolve } from 'path';
import { Worker } from 'worker_threads';
import consola from 'consola';

/**
 * Runs `prisma migrate deploy` to deploy migrations.
 */
const migrate = () => {
  const logger = consola.withScope('Migrator Worker');
  const worker = new Worker(resolve(process.cwd(), 'scripts', 'prisma.migrations'));

  logger.info(`Spawned with thread #${worker.threadId}.`);
  worker.stdout?.on('data', (chunk) => logger.info(chunk));
  worker.stderr?.on('data', (chunk) => logger.warn(chunk));
  worker.on('message', (data) => {
    if (data === 'done') logger.info('Worker has completed its work.');
    if (data === 'error') logger.warn('Worker has encountered an error :(');
  });
};

export default migrate;
