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

import { version, commitHash } from '../util/Constants';
import { Component, Inject } from '@augu/lilith';
import { hostname } from 'os';
import { Logger } from 'tslog';
import sentry from '@sentry/node';
import Config from './Config';

export default class Sentry implements Component {
  public priority: number = 1;
  public name: string = 'Sentry';

  @Inject
  private logger!: Logger;

  @Inject
  private config!: Config;

  load() {
    this.logger.info('Initializing Sentry...');

    const dsn = this.config.getProperty('sentryDsn');
    if (dsn === undefined) {
      this.logger.warn('Missing sentryDsn variable in config.yml! Don\'t worry, this is optional.');
      return;
    }

    sentry.init({
      tracesSampleRate: 1.0,
      integrations: [
        new sentry.Integrations.Http({ tracing: true })
      ],
      environment: this.config.getProperty('environment')!,
      serverName: hostname(),
      release: version,
      dsn
    });

    sentry.configureScope(scope =>
      scope.setTags({
        'nino.environment': this.config.getProperty('environment')!,
        'nino.commitHash': commitHash,
        'nino.version': version,
        'system.user': require('os').userInfo().username,
        'system.os': process.platform
      })
    );

    this.logger.info('Sentry has been installed.');
  }

  report(ex: Error) {
    sentry.captureException(ex);
  }
}
