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

import './utils/patch/RequirePatch';
import 'reflect-metadata';

(require('@augu/dotenv') as typeof import('@augu/dotenv')).parse({
  populate: true,
  delimiter: ',',
  file: (require('path') as typeof import('path')).join(process.cwd(), '..', '.env'),
  schema: {
    NODE_ENV: {
      oneOf: ['production', 'development'],
      default: 'development',
      type: 'string',
    },

    DATABASE_URL: 'string',
  },
});

import { gitCommitHash, version } from '~/utils/Constants';
import consola from 'consola';
import app from './container';
import ts from 'typescript';

const log = consola.withScope('nino');
const main = async () => {
  log.info(`-+- Nino v${version} (${gitCommitHash ?? '<unknown>'}) -+-`);
  log.info(`> Created by the Nino Team over at Noelware, released under MIT.`);
  log.info(`> Environment: ${process.env.NODE_ENV}`);
  log.info(`> TypeScript:  v${ts.version}`);
  log.info(`> Node.js:     v${process.version}`);

  if (process.env.DEDI !== undefined) log.info(`> Dedi Node: ${process.env.DEDI}`);

  try {
    await app.load();
  } catch (ex) {
    log.fatal('An exception has occured while loading DI container:', ex);
    process.exit(1);
  }

  log.info('✔ Initialized container for Nino');
  process.on('SIGINT', () => {
    log.warn('Received CTRL+C call!');

    app.dispose();
    process.exit(0);
  });
};

main().catch((ex) => {
  log.fatal('Unknown exception has occured while loading Nino:', ex);
  process.exit(1);
});
