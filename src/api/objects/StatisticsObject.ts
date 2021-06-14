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

import { ObjectType, Field, Int } from 'type-graphql';
import type { Shard } from 'eris';

@ObjectType()
class ShardObject {
  @Field(() => String, { description: 'The shard\'s status' })
  status!: Shard['status'];

  @Field(() => Int, { description: 'How many guilds this shard holds' })
  guilds!: number;

  @Field(() => Int, { description: 'How many members in all guilds this shard holds' })
  users!: number;

  @Field(() => Int, { description: 'Identifier of the shard.' })
  id!: number;
}

@ObjectType()
class DatabaseObject {
  @Field({ description: 'The uptime of the main database (PostgreSQL)' })
  uptime!: string;

  @Field({ description: 'Latency between the main database (PostgreSQL) to the bot.' })
  ping!: string;
}

@ObjectType()
class RedisObject {
  @Field({ description: 'The amount of bytes the network has received from the net -> bot.' })
  networkOutput!: string;

  @Field({ description: 'The amount of bytes the network has recieved from the bot -> the network. ' })
  networkInput!: string;

  @Field(() => Int, { description: 'How many operations per second that is being executed.' })
  operations!: number;

  @Field({ description: 'The uptime of the server.' })
  uptime!: string;

  @Field({ description: 'The latency between Redis -> the bot.' })
  ping!: string;
}

@ObjectType()
class MemoryUsageObject {
  @Field({ description: 'How much object heap is being used' })
  heap!: string;

  @Field({ description: 'How much RSS (Residental Set Size) is being used.' })
  rss!: string;
}

@ObjectType()
class TimeoutsObject {
  @Field({ description: 'If the timeouts service is operating.' })
  online!: boolean;
}

@ObjectType()
export default class StatisticsObject {
  @Field(() => Int, { description: 'The average latency between all shards' })
  avgShardLatency!: number;

  @Field({ description: 'The memory usage on the bot process' })
  memoryUsage!: MemoryUsageObject;

  @Field({ description: 'Information about the timeouts microservice' })
  timeouts!: TimeoutsObject;

  @Field({ description: 'Information about the main database (PostgreSQL)' })
  database!: DatabaseObject;

  @Field(() => Int, { description: 'How many channels Nino can see in all guilds.' })
  channels!: number;

  @Field(() => [ShardObject], { description: 'Information about the bot\'s shards.' })
  shards!: ShardObject[];

  @Field(() => Int, { description: 'How many guilds Nino is currently serving' })
  guilds!: number;

  @Field(() => Int, { description: 'How many users Nino is currently serving' })
  users!: number;

  @Field({ description: 'Information about Redis.' })
  redis!: RedisObject;

  @Field({ description: 'The Kubernetes node Nino is operating on, will always returns `Unknown` if not in production.' })
  node!: string;
}
