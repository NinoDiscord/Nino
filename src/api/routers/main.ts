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

import { Router } from '@augu/http';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import Redis from '../../components/Redis';
import app from '../../container';

const router = new Router('/');
const statuses = {
  disconnected: 'Disconnected',
  handshaking: 'Connecting',
  connecting: 'Connecting',
  resuming: 'Resuming',
  ready: 'Ready'
};

// You're not allowed here!
router.get('/', (_, res) => res.redirect('https://nino.floofy.dev'));

// Health checks
router.get('/health', (_, res) => {
  const database: Database = app.$ref<any>(Database);
  const discord: Discord = app.$ref<any>(Discord);
  const redis: Redis = app.$ref<any>(Redis);

  return res.status(200).json({
    database: database.connection.isConnected,
    shards: discord.client.shards.map(shard => ({
      [shard.id]: statuses[shard.status]
    })),
    redis: redis.client.status === 'ready',
    bot: discord.client.startTime > 0
  });
});

export default router;
