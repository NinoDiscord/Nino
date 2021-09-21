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

import { parentPort, isMainThread } from 'worker_threads';
import { resolve as _pathResolve } from 'path';
import { spawn } from 'child_process';

if (isMainThread) {
  console.log('Cannot run `scripts/prisma.migrations.js` in main thread (i.e, `node ...`');
  process.exit(1);
}

class Spawner {
  static async spawn(path: string, args: string[]) {
    console.log(`Spawning process in path ${_pathResolve(path)}...`);
    return new Promise<void>((resolve, reject) => {
      const proc = spawn(_pathResolve(path), args, {
        env: {
          ...process.env,
        },
      });

      proc.stdout?.on('data', (data) => console.log(data));
      proc.stderr?.on('data', (data) => console.log(data));
      proc.on('exit', (code) => {
        console.log(`exited with code ${code}.`);
        code === 0 ? resolve() : reject();
      });
    });
  }
}

Spawner.spawn('./node_modules/prisma/cli/@build/index.js', ['migrate', 'deploy'])
  .then(() => parentPort?.postMessage('done'))
  .catch(() => parentPort?.postMessage('error'));
