import { Client as DiscordClient, Guild, AnyChannel, Role } from 'eris';
import { collectDefaultMetrics } from 'prom-client';
import CommandStatisticsManager from './managers/CommandStatisticsManager';
import { inject, injectable } from 'inversify';
import RedisClient, { Redis } from 'ioredis';
import { captureException } from '@sentry/node';
import PrometheusManager from './managers/PrometheusManager';
import PunishmentManager from './managers/PunishmentManager';
import { setDefaults } from 'wumpfetch';
import TimeoutsManager from './managers/TimeoutsManager';
import DatabaseManager from './managers/DatabaseManager';
import CommandManager from './managers/CommandManager';
import { lazyInject } from '../inversify.config';
import AutomodService from './services/AutomodService';
import BotListService from './services/BotListService';
import StatusManager from './managers/StatusManager';
import GuildSettings from './settings/GuildSettings';
import CaseSettings from './settings/CaseSettings';
import EmbedBuilder from './EmbedBuilder';
import EventManager from './managers/EventManager';
import NinoCommand from './Command';
import { TYPES } from '../types';
import Warnings from './settings/Warning';
import Logger from './Logger';
import 'reflect-metadata';

const pkg = require('../../package.json');
setDefaults({
  headers: {
    'User-Agent': `Nino/DiscordBot (v${pkg.version}, https://github.com/auguwu/Nino)`
  }
});

export interface Config {
  disabledCategories: string[] | undefined;
  disabledCommands: string[] | undefined;
  environment: 'development' | 'production';
  databaseUrl: string;
  statusType: number | undefined;
  sentryDSN: string | undefined;
  status: string | undefined;
  owners: string[] | undefined;
  prometheus: number;
  ksoft: string | undefined;
  discord: {
    prefix: string;
    token: string;
  };
  redis: {
    database: number | undefined;
    host: string;
    port: number;
  };
  botlists: {
    dboatstoken: string | undefined;
    topggtoken: string | undefined;
    bfdtoken: string | undefined;
    blstoken: string | undefined;
  } | undefined;
  webhook: {
    token: string;
    id: string;
  } | undefined;
}

@injectable()
export default class Bot {
  public warnings: Warnings;
  public logger: Logger;
  public owners: string[];
  public client: DiscordClient;
  public config: Config;
  public redis: Redis;
  public cases: CaseSettings;

  @lazyInject(TYPES.DatabaseManager)
  public database!: DatabaseManager;

  @lazyInject(TYPES.CommandManager)
  public manager!: CommandManager;

  @lazyInject(TYPES.PrometheusManager)
  public prometheus!: PrometheusManager;

  @lazyInject(TYPES.TimeoutsManager)
  public timeouts!: TimeoutsManager;

  @lazyInject(TYPES.AutoModService)
  public automod!: AutomodService;

  @lazyInject(TYPES.EventManager)
  public events!: EventManager;

  @lazyInject(TYPES.BotListService)
  public botlists!: BotListService;

  @lazyInject(TYPES.GuildSettings)
  public settings!: GuildSettings;

  @lazyInject(TYPES.StatusManager)
  public status!: StatusManager;

  @lazyInject(TYPES.CommandStatisticsManager)
  public statistics!: CommandStatisticsManager;

  @lazyInject(TYPES.PunishmentManager)
  public punishments!: PunishmentManager;

  constructor(
    @inject(TYPES.Config) config: Config,
    @inject(TYPES.Client) client: DiscordClient 
  ) {
    this.warnings = new Warnings();
    this.config = config;
    this.client = client;
    this.owners = config.owners || [];
    this.logger = new Logger();
    this.cases = new CaseSettings();
    this.redis = new RedisClient({
      port: config.redis.port,
      host: config.redis.host,
      db: config.redis.database
    });

    this.addRedisEvents();
  }

  async build() {
    collectDefaultMetrics();

    this.logger.info('Connecting to the database...');
    await this.database.connect();

    this.logger.info('Success! Connecting to the Redis pool...');
    // eslint-disable-next-line
    await this.redis.connect().catch(() => {});

    this.logger.info('Success! Initializing events...');
    this.events.run();

    this.logger.info('Success! Connecting to Discord...');
    await this.client.connect()
      .then(() => this.logger.info('Connecting to Discord...'))
      .catch(ex => this.logger.error(ex));
  }

  dispose() {
    this.database.dispose();
    this.redis.disconnect();
    this.client.disconnect({ reconnect: false });
    this.logger.warn('Bot connection was disposed');
  }

  getEmbed() {
    return new EmbedBuilder()
      .setColor(0x6D6D99);
  }

  report(ex: any) {
    captureException(ex);
  }

  private addRedisEvents() {
    this.redis.once('ready', () => this.logger.redis(`Created a Redis pool at ${this.config.redis.host}:${this.config.redis.port}${this.config.redis.database ? `, with database ID: ${this.config.redis.database}` : ''}`));
    this.redis.on('wait', async () => {
      this.logger.redis('Redis has disconnected and awaiting a new pool...');
      if (this.config.webhook) {
        await this.client.executeWebhook(this.config.webhook.id, this.config.webhook.token, {
          content: ':pencil2: **| Redis connection is unstable, waiting for a new pool to be established...**'
        });
      }
    });
  }
}