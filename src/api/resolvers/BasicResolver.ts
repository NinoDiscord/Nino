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

import { Ctx, Query, Resolver } from 'type-graphql';
import type { NinoContext } from '../API';
import StatisticsObject from '../objects/StatisticsObject';
import TimeoutsManager from '../../components/timeouts/Timeouts';
import { SocketState } from '../../components/timeouts/types';
import { formatSize } from '../../util';
import { humanize } from '@augu/utils';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import Redis from '../../components/Redis';

@Resolver()
export class BasicResolver {
  @Query(() => String, { description: 'Tests out the GraphQL API.' })
  hello() {
    return 'world';
  }

  @Query(() => StatisticsObject, {
    description: 'Returns a list of statistics that is handy for the website.'
  })
  async statistics(
    @Ctx() { container }: NinoContext
  ) {
    const redis = container.$ref<Redis>(Redis);
    const discord = container.$ref<Discord>(Discord);
    const timeouts = container.$ref<TimeoutsManager>(TimeoutsManager);
    const database = container.$ref<Database>(Database);

    const shards = discord.client.shards.map(shard => ({
      status: shard.status,
      guilds: discord.client.guilds.filter(s => s.shard.id === shard.id).length,
      users: discord.client.guilds.filter(s => s.shard.id === shard.id).reduce((a, b) => a + b.memberCount, 0),
      id: shard.id
    }));

    const dbStats = await database.getStatistics();
    const redisStats = await redis.getStatistics();
    const memory = {
      heap: formatSize(process.memoryUsage().heapUsed),
      rss: formatSize(process.memoryUsage().rss)
    };

    return {
      avgShardLatency: discord.client.shards.reduce((a, b) => a + b.latency, 0),
      memoryUsage: memory,
      timeouts: { online: timeouts.state === SocketState.Connected },
      database: {
        uptime: dbStats.uptime,
        ping: dbStats.ping
      },
      channels: Object.keys(discord.client.channelGuildMap).length,
      shards,
      guilds: discord.client.guilds.size,
      redis: {
        networkOutput: formatSize(redisStats.stats.total_net_output_bytes),
        networkInput: formatSize(redisStats.stats.total_net_input_bytes),
        operations: redisStats.stats.instantaneous_ops_per_sec,
        uptime: humanize(Number(redisStats.server.uptime_in_seconds) * 100, true),
        ping: redisStats.ping
      },
      node: process.env['REGION'] ?? 'Unknown'
    };
  }
}
