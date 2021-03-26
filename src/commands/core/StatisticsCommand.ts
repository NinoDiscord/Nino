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

import { Color, version, commitHash } from '../../util/Constants';
import { Command, CommandMessage } from '../../structures';
import { Inject } from '@augu/lilith';
import Stopwatch from '../../util/Stopwatch';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import Redis from '../../components/Redis';

export default class StatisticsCommand extends Command {
  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  @Inject
  private redis!: Redis;

  constructor() {
    super({
      description: 'descriptions.statistics',
      aliases: ['stats', 'botinfo', 'info', 'me'],
      cooldown: 8,
      name: 'statistics'
    });
  }

  private async getRedisPing() {
    const stopwatch = new Stopwatch();

    stopwatch.start();
    await this.redis.client.ping('Ice is cute as FUCK');

    return stopwatch.end();
  }

  private async getDBPing() {
    const stopwatch = new Stopwatch();
    stopwatch.start();

    await this.database.connection.query('SELECT * FROM guilds;');
    return stopwatch.end();
  }

  async run(msg: CommandMessage) {
    // Check for databases ping
    const redisPing = await this.getRedisPing();
    const dbPing = await this.getDBPing();

    // Check for database information
  }
}
