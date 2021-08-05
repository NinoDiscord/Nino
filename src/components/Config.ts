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

import { writeFileSync, existsSync } from 'fs';
import { Component, Inject } from '@augu/lilith';
import { readFile } from 'fs/promises';
import { Logger } from 'tslog';
import { join } from 'path';
import yaml from 'js-yaml';

const NOT_FOUND_SYMBOL = Symbol.for('$nino::config::not.found');

interface Configuration {
  runPendingMigrations?: boolean;
  prometheusPort?: number;
  defaultLocale?: string;
  environment: 'development' | 'production';
  sentryDsn?: string;
  botlists?: BotlistConfig;
  timeouts: TimeoutsConfig;
  database: DatabaseConfig;
  prefixes: string[];
  status: StatusConfig;
  owners: string[];
  ksoft?: string;
  redis: RedisConfig;
  token: string;
  api?: boolean;
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
  master?: string;
  index?: number;
  host: string;
  port: number;
}

interface TimeoutsConfig {
  host?: string;
  auth: string;
  port: number;
}

interface StatusConfig {
  presence?: 'online' | 'idle' | 'dnd' | 'offline';
  status: string;
  type: 0 | 1 | 2 | 3 | 5;
}

// eslint-disable-next-line
interface RedisSentinelConfig extends Pick<RedisConfig, 'host' | 'port'> {}

@Component({
  priority: 0,
  name: 'config',
})
export default class Config {
  private config!: Configuration;

  @Inject
  private readonly logger!: Logger;

  async load() {
    if (!existsSync(join(__dirname, '..', '..', 'config.yml'))) {
      const config = yaml.dump(
        {
          runPendingMigrations: true,
          defaultLocale: 'en_US',
          environment: 'production',
          prefixes: ['!'],
          owners: [],
          token: '-- replace me --',
        },
        {
          indent: 2,
          noArrayIndent: false,
        }
      );

      writeFileSync(join(__dirname, '..', '..', 'config.yml'), config);
      return Promise.reject(
        new SyntaxError(
          "Weird, you didn't have a configuration file... So, I may have provided you a default one, if you don't mind... >W<"
        )
      );
    }

    this.logger.info('Loading configuration...');
    const contents = await readFile(join(__dirname, '..', '..', 'config.yml'), 'utf8');
    const config = yaml.load(contents) as unknown as Configuration;

    this.config = {
      runPendingMigrations: config.runPendingMigrations ?? false,
      prometheusPort: config.prometheusPort,
      defaultLocale: config.defaultLocale ?? 'en_US',
      environment: config.environment ?? 'production',
      sentryDsn: config.sentryDsn,
      botlists: config.botlists,
      database: config.database,
      timeouts: config.timeouts,
      prefixes: config.prefixes,
      owners: config.owners,
      status: config.status ?? {
        type: 0,
        status: '$prefix$help | $guilds$ Guilds',
        presence: 'online',
      },
      ksoft: config.ksoft,
      redis: config.redis,
      token: config.token,
      api: false,
    };

    if (this.config.token === '-- replace me --')
      return Promise.reject(new TypeError('Restore `token` in config with your discord bot token.'));

    // resolve the promise
    return Promise.resolve();
  }

  getProperty<K extends ObjectKeysWithSeperator<Configuration>>(key: K): KeyToPropType<Configuration, K> | undefined {
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
