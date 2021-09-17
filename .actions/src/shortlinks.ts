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

import * as github from '@actions/github';
import * as core from '@actions/core';
import { exec } from 'child_process';
import { join } from 'path';

const overwriteLogger = () => {
  const mapped = {
    info: core.info,
    debug: core.debug,
    warn: core.warning,
    error: core.error,
  };

  for (const key of ['info', 'debug', 'warn', 'error']) {
    const mappedFn = mapped[key];
    core[key] = (message: string) => {
      const date = new Date();
      const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

      return mappedFn(
        `[${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)}:${`0${date.getSeconds()}`.slice(
          -2
        )} ${ampm}] ${message}`
      );
    };
  }
};

const exitIfCodeExists = () => {
  if (process.exitCode !== undefined) process.exit(process.exitCode);
};

const main = () => {
  overwriteLogger();

  if (github.context.eventName === 'push' && github.context.payload?.head_commit) {
    if (github.context.payload.head_commit.message.includes('[skip action]')) {
      core.info('Told to skip the action, not running.');
      process.exitCode = 1;
    }
  }

  exitIfCodeExists();
  core.info('Now running `shortlinks` action...');

  const proc = exec('node scripts/shortlinks.js', {
    cwd: join(__dirname, '..', '..'),
  });

  proc.stdout?.on('data', (chunk) => core.info(`\n${chunk}`));
  proc.stderr?.on('data', (chunk) => core.warning(`\n${chunk}`));

  return new Promise((resolve, reject) =>
    proc.on('exit', (code, signal) => {
      core.info(`Script exited with code ${code}${signal ? `, with signal ${signal}` : ''}.`);
      return code === 0 ? resolve(void 0) : reject();
    })
  );
};

main().catch(() => process.exit(1));
