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
import { randomBytes } from 'crypto';
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
  owners: string[];
  ksoft?: string;
  redis: RedisConfig;
  token: string;
  k8s?: KubernetesConfig;
  api?: APIConfig;
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

interface KubernetesConfig {
  namespace: string;
}

interface APIConfig {
  allowState: boolean;
  secret: string;
  port: number;
}

interface TimeoutsConfig {
  host?: string;
  auth: string;
  port: number;
}

// eslint-disable-next-line
interface RedisSentinelConfig extends Pick<RedisConfig, 'host' | 'port'> {}

@Component({
  priority: 0,
  name: 'config'
})
export default class Config {
  private config!: Configuration;

  @Inject
  private logger!: Logger;

  async load() {
    if (!existsSync(join(__dirname, '..', '..', 'config.yml'))) {
      const config = yaml.dump({
        runPendingMigrations: true,
        defaultLocale: 'en_US',
        environment: 'production',
        prefixes: ['!'],
        owners: [],
        token: '-- replace me --'
      }, {
        indent: 2,
        noArrayIndent: false
      });

      writeFileSync(join(__dirname, '..', '..', 'config.yml'), config);
      return Promise.reject(new SyntaxError('Weird, you didn\'t have a configuration file... So, I may have provided you a default one, if you don\'t mind... >W<'));
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
      ksoft: config.ksoft,
      redis: config.redis,
      token: config.token,
      k8s: config.k8s,
      api: config.api
    };

    if (this.config.token === '-- replace me --')
      return Promise.reject(new TypeError('Restore `token` in config with your discord bot token.'));

    if (this.config.api !== undefined && this.config.api.secret === undefined) {
      this.config.api.secret = randomBytes(32).toString('hex');

      const config = yaml.dump(this.config, { indent: 2, noArrayIndent: false });
      writeFileSync(join(__dirname, '..', '..', 'config.yml'), config);

      this.logger.warn('API secret was missing so I did it myself and is saved in your configuration file.');
    }

    // resolve the promise
    return Promise.resolve();
  }

  getProperty<K extends keyof Configuration>(key: K): Configuration[K] | undefined;
  getProperty<K extends keyof DatabaseConfig>(key: `database.${K}`): DatabaseConfig[K] | undefined;
  getProperty<K extends keyof BotlistConfig>(key: `botlists.${K}`): BotlistConfig[K] | undefined;
  getProperty<K extends keyof RedisConfig>(key: `redis.${K}`): RedisConfig[K] | undefined;
  getProperty<K extends keyof KubernetesConfig>(key: `k8s.${K}`): KubernetesConfig[K] | undefined;
  getProperty<K extends keyof APIConfig>(key: `api.${K}`): APIConfig[K] | undefined;
  getProperty<K extends keyof TimeoutsConfig>(key: `timeouts.${K}`): TimeoutsConfig[K] | undefined;
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
