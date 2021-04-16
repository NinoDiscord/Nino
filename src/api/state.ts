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

import { Inject, Service } from '@augu/lilith';
import { Logger } from 'tslog';
import Config from '../components/Config';
import Redis from '../components/Redis';

type InviteStateLocation = 'bots.gg' | 'top.gg' | 'bfd' | 'dlist' | 'delly' | 'dservices' | 'boats' | 'command' | 'website';
interface InviteOAuth2State {
  location: InviteStateLocation;
  code: string;
}

/**
 * External class to handle Discord OAuth2 state for authorization
 */
@Service({
  priority: 9,
  name: 'oauth2'
})

// since this class is just for handling where Nino was invited
// this won't be initialized unless `allowState: true` is enabled
// under the "api" configuration.
export default class OAuth2StateService {
  @Inject
  private logger!: Logger;

  @Inject
  private config!: Config;

  @Inject
  private redis!: Redis;

  async load() {
    const api = this.config.getProperty('api');
    if (api?.allowState === false) {
      this.logger.warn('api.allowState is not set to `true` or "api" config block is missing, this isn\'t recommended for private instances');
      return Promise.resolve();
    }

    const botlists = await this
      .redis
      .client
      .hvals('nino:oauth2:states:invites')
      .then(val => val.map(v => JSON.parse<InviteOAuth2State>(v)).flat());
  }
}
