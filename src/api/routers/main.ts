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

import type { Request, Response } from 'express';
import { Inject, LinkParent } from '@augu/lilith';
import TimeoutsManager from '../../structures/timeouts/TimeoutsManager';
import { Router } from '@augu/http';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import { Get } from '../decorators';
import Redis from '../../components/Redis';
import Api from '../API';

const statuses = {
  disconnected: 'Disconnected',
  handshaking: 'Connecting',
  connecting: 'Connecting',
  resuming: 'Resuming',
  ready: 'Ready'
};

@LinkParent(Api)
export default class CasesRouter extends Router {
  @Inject
  private timeouts!: TimeoutsManager;

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  @Inject
  private redis!: Redis;

  constructor() {
    super('/');
  }

  @Get('/')
  async main(_: Request, res: Response) {
    // no! no access 4 u
    return res.redirect('https://nino.floofy.dev');
  }

  @Get('/health')
  async health(_: Request, res: Response) {
    return res.status(200).json({
      database: this.database.connection.isConnected,
      timeouts: this.timeouts.state === 'connected',
      shards: this.discord.client.shards.map(shard => ({ [shard.id]: statuses[shard.status] })),
      redis: this.redis.client.status === 'ready',
      bot: this.discord.client.ready
    });
  }
}
