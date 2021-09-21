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

import type { RESTGetAPIGatewayBotResult } from 'discord-api-types';
import { Collection } from '@augu/collections';
import { formatDate } from '@augu/utils';
import { Client } from 'eris';
import consola from 'consola';

/**
 * Represents a structure to extend {@link Client Eris} with [clustering](https://github.com/MikaBot/cluster-operator).
 */
export default class Discord extends Client {
  private readonly logger = consola.withScope('nino:discord');

  /**
   * Returns the removal interval to clear message cache.
   */
  #_messageCacheRemoval?: NodeJS.Timer;

  /**
   * Returns the message cache from receiving messages
   */
  messageCache: string[] = [];

  /**
   * Returns all the clusters available, this is empty
   * IF clustering is not enabled.
   */
  clusters = new Collection<number, any>();

  /**
   * Launches the bot towards Discord
   */
  async launch() {
    // Get shard information
    const data = (await this.requestHandler.request(
      'GET',
      '/gateway/bot',
      true
    )) as unknown as RESTGetAPIGatewayBotResult;

    this.logger.info(
      `Launching to Discord with ${data.shards} shards | Session: ${data.session_start_limit.remaining}/${
        data.session_start_limit.total
      } - Resets at ${formatDate(new Date(Date.now() + data.session_start_limit.reset_after))}`
    );

    // Check if clustering is enabled
  }
}
