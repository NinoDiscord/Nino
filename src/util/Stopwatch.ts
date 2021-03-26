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

import { performance } from 'perf_hooks';

/** Represents the current state of the [Stopwatch] */
enum State {
  Started,
  Stopped,
  Unknown
}

/**
 * Utility stopwatch for calculating duration on asynchronous execution
 */
export default class Stopwatch {
  public startTime?: number;
  public state: State = State.Unknown;

  private symbolOf(type: number) {
    if (type > 1000) return `${type.toFixed(1)}s`;
    if (type > 1) return `${type.toFixed(1)}ms`;
    return `${type.toFixed(1)}µs`;
  }

  start() {
    if (this.startTime !== undefined)
      throw new SyntaxError('Stopwatch has already started');

    this.startTime = performance.now();
  }

  end() {
    if (!this.startTime)
      throw new TypeError('Stopwatch has not started');

    const endTime = performance.now();
    return this.symbolOf(endTime - this.startTime);
  }
}
