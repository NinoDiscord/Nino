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

import { readFile, writeFile } from 'fs/promises';
import consola, { Consola } from 'consola';
import { existsSync } from 'fs';
import { Component } from '@augu/lilith';
import { join } from 'path';
import yaml from 'js-yaml';
import z from 'zod';

const NotFoundSymbol = Symbol('Key: Not Found');

interface Configuration {
  runPendingMigrations?: boolean;
  prometheusPort?: number;
  defaultLocale?: 'en_US' | 'fr_FR' | 'pt_BR';
  environment?: 'development' | 'production';
  sentryDsn?: string;
  owners?: string[];
  relay?: boolean;
  ravy?: string;
  token: string;

  clustering?: ClusterConfig;
  botlists?: BotlistConfig;
  timeouts: TimeoutsConfig;
  status?: StatusConfig;
  redis: RedisConfig;
}

interface BotlistConfig {
  dservices?: string;
  interval?: number;
  dboats?: string;
  topgg?: string;
  delly?: string;
  dbots?: string;
  discords?: string;
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

interface Status {
  type: 0 | 1 | 2 | 3 | 5;
  status: string;
  presence?: 'online' | 'idle' | 'dnd' | 'offline';
}

interface StatusConfig {
  presence?: 'online' | 'idle' | 'dnd' | 'offline';
  interval?: string;
  statuses: Status[];
}

interface ClusterConfig {
  host?: string;
  port: number;
  auth: string;
}

// eslint-disable-next-line
interface RedisSentinelConfig extends Pick<RedisConfig, 'host' | 'port'> {}

const sentinelSchema = z.object({
  host: z.string(),
  port: z.number(),
});

const schema = z.object({
  runPendingMigrations: z.boolean().default(true).optional(),
  prometheusPort: z.number().min(1024).max(65535).optional().default(22403),
  defaultLocale: z.literal('en_US').or(z.literal('fr_FR')).or(z.literal('pt_BR')).optional().default('en_US'),
  environment: z.literal('development').or(z.literal('production')).optional(),
  sentryDsn: z.string().optional(),
  owners: z.array(z.string()).optional().default([]),
  relay: z.boolean().optional().default(false),
  ravy: z.string().optional(),
  token: z.string(),

  clustering: z
    .object({
      host: z.string().optional(),
      port: z.number().min(1024).max(65535).optional().default(3010),
      auth: z.string(),
    })
    .optional(),

  botlists: z
    .object({
      dservices: z.string().optional(),
      interval: z.number().min(15000).max(86400000).default(30000).nullable(),
      dboats: z.string().optional(),
      topgg: z.string().optional(),
      delly: z.string().optional(),
      dbots: z.string().optional(),
      discords: z.string().optional(),
    })
    .optional(),

  redis: z.object({
    sentinels: z.array(sentinelSchema).optional(),
    password: z.string().optional(),
    master: z.string().optional(),
    index: z.number().default(4).optional(),
    host: z.string().optional(),
    port: z.number().optional().default(6379),
  }),

  timeouts: z
    .object({
      host: z.string().optional(),
      port: z.number().min(1024).max(65535).optional().default(3010),
      auth: z.string(),
    })
    .optional(),

  status: z.object({
    presence: z
      .literal('online')
      .or(z.literal('idle'))
      .or(z.literal('dnd'))
      .or(z.literal('offline'))
      .optional()
      .default('online'),

    statuses: z
      .array(
        z.object({
          presence: z
            .literal('online')
            .or(z.literal('idle'))
            .or(z.literal('dnd'))
            .or(z.literal('offline'))
            .optional()
            .default('online'),

          status: z.string(),
        })
      )
      .default([]),
  }),
});

@Component({ priority: 0, name: 'config' })
export default class Config {
  private readonly logger: Consola = consola.withScope('nino:config');
  #_config!: Configuration;

  async load() {
    this.logger.info('loading configuration...');

    const configPath = join(__dirname, '..', '..', 'config.yml');
    if (!existsSync(configPath)) {
      const config = yaml.dump(
        {
          runPendingMigrations: true,
          defaultLocale: 'en_US',
          prefixes: ['x!'],
          owners: [],
          token: '--replace me--',
        },
        { indent: 2, noArrayIndent: true }
      );

      await writeFile(configPath, config);
      throw new SyntaxError(`You were missing a \`config.yml\` file in "${configPath}", I created one for you!`);
    }

    const contents = await readFile(configPath, 'utf-8');
    this.#_config = yaml.load(contents) as unknown as Configuration;

    // validate it
    try {
      await schema.parseAsync(this.#_config);
    } catch (ex) {
      const error = ex as z.ZodError;
      this.logger.error('Unable to validate config:', error);
    }

    if (this.#_config.token === '--replace me--') throw new Error('Please replace your token to authenticate!');
  }

  get<K extends ObjectKeysWithSeperator<Configuration>>(key: K): KeyToPropType<Configuration, K> | undefined;
  get<K extends ObjectKeysWithSeperator<Configuration>>(key: K, throwOnNull: true): KeyToPropType<Configuration, K>;
  get<K extends ObjectKeysWithSeperator<Configuration>>(
    key: K,
    throwOnNull: false
  ): KeyToPropType<Configuration, K> | undefined;

  get<K extends ObjectKeysWithSeperator<Configuration>>(
    key: K,
    throwOnNull?: boolean
  ): KeyToPropType<Configuration, K> | undefined {
    const nodes = key.split('.');
    let value: any = this.#_config;

    for (let i = 0; i < nodes.length; i++) {
      try {
        value = value[nodes[i]];
      } catch (ex) {
        value = NotFoundSymbol;
        break; // break the chain
      }
    }

    if (throwOnNull === true && value === NotFoundSymbol) throw new Error(`Key ${key} was not found.`);
    return value === NotFoundSymbol ? undefined : value;
  }
}
