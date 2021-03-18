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

/* eslint-disable camelcase */

import { Component } from '@augu/lilith';
import { readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';

const NOT_FOUND_SYMBOL = Symbol.for('$nino::config::not.found');

interface Configuration {
  environment: 'development' | 'production';
  sentryDsn?: string;
  botlists?: BotlistConfig;
  database: DatabaseConfig;
  prefixes: string[];
  owners: string[];
  ksoft?: string;
  redis: RedisConfig;
  token: string;
}

interface BotlistConfig {
  dservices?: string;
  dboats?: string;
  topgg?: string;
  delly?: string;
  dbots?: string;
  bfd?: string;
}

interface DatabaseConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  url?: string;
}

interface RedisConfig {
  sentinels?: RedisSentinelConfig[];
  password?: string;
  index?: number;
  host: string;
  port: number;
}

// eslint-disable-next-line
interface RedisSentinelConfig extends Pick<RedisConfig, 'host' | 'port'> {}

export default class Config implements Component {
  private config!: Configuration;
  public priority: number = 0;
  public name: string = 'Config';

  async load() {
    const contents = await readFile(join(__dirname, '..', '..', 'config.yml'), 'utf8');
    const config = yaml.load(contents) as unknown as Configuration;

    this.config = {
      environment: config.environment ?? 'production',
      sentryDsn: config.sentryDsn,
      botlists: config.botlists,
      database: config.database,
      prefixes: config.prefixes,
      owners: config.owners,
      ksoft: config.ksoft,
      redis: config.redis,
      token: config.token
    };
  }

  getProperty<K extends keyof Configuration>(key: K): Configuration[K] | undefined;
  getProperty<K extends keyof DatabaseConfig>(key: `database.${K}`): DatabaseConfig[K] | undefined;
  getProperty<K extends keyof BotlistConfig>(key: `botlists.${K}`): BotlistConfig[K] | undefined;
  getProperty<K extends keyof RedisConfig>(key: `redis.${K}`): RedisConfig[K] | undefined;
  getProperty(key: string) {
    const nodes = key.split('.');
    let value: any = this.config;

    for (const frag of nodes) {
      try {
        value = value[frag];
      } catch {
        value = NOT_FOUND_SYMBOL;
      }
    }

    return value === NOT_FOUND_SYMBOL ? undefined : value;
  }
}
