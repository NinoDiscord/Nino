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
  @Field(() => String)
  status!: Shard['status'];

  @Field(() => Int)
  guilds!: number;

  @Field(() => Int)
  users!: number;

  @Field(() => Int)
  id!: number;
}

@ObjectType()
class DatabaseObject {
  @Field(() => Int)
  uptime!: number;

  @Field(() => Int)
  ping!: number;
}

@ObjectType()
class RedisObject {
  @Field(() => Int)
  networkOutput!: number;

  @Field(() => Int)
  networkInput!: number;

  @Field(() => Int)
  operations!: number;

  @Field()
  uptime!: string;

  @Field(() => Int)
  ping!: number;
}

@ObjectType()
class MemoryUsageObject {
  @Field()
  heap!: string;

  @Field()
  rss!: string;

  @Field()
  cpu!: string;
}

@ObjectType()
class TimeoutsObject {
  @Field()
  online!: boolean;
}

@ObjectType()
export default class StatisticsObject {
  @Field(() => Int)
  avgShardLatency!: number;

  @Field()
  memoryUsage!: MemoryUsageObject;

  @Field()
  timeouts!: TimeoutsObject;

  @Field()
  database!: DatabaseObject;

  @Field(() => Int)
  channels!: number;

  @Field(() => [ShardObject])
  shards!: ShardObject;

  @Field(() => Int)
  guilds!: number;

  @Field(() => Int)
  users!: number;

  @Field()
  redis!: RedisObject;

  @Field()
  node!: string;
}
