import { Client as DiscordClient } from 'eris';
import CommandStatisticsManager from './managers/CommandStatisticsManager';
import { inject, injectable } from 'inversify';
import RedisClient, { Redis, RedisOptions } from 'ioredis';
import { captureException } from '@sentry/node';
import LocalizationManager from './managers/LocalizationManager';
import PunishmentService from './services/PunishmentService';
import { setDefaults } from 'wumpfetch';
import TimeoutsManager from './managers/TimeoutsManager';
import DatabaseManager from './managers/DatabaseManager';
import CommandManager from './managers/CommandManager';
import { lazyInject } from '../inversify.config';
import AutomodService from './services/AutomodService';
import BotListService from './services/BotListService';
import StatusManager from './managers/StatusManager';
import GuildSettingsService from './services/settings/GuildSettingsService';
import UserSettingsService from './services/settings/UserSettingsService';
import CaseSettingsService from './services/settings/CaseSettingsService';
import EventManager from './managers/EventManager';
import { TYPES } from '../types';
import Warnings from './services/WarningService';
import Logger from './Logger';
import 'reflect-metadata';

const pkg = require('../../package.json');
setDefaults({
  headers: {
    'User-Agent': `Nino/DiscordBot (v${pkg.version}, https://github.com/NinoDiscord/Nino)`
  }
});

export interface Config {
  disabledCategories: string[] | undefined;
  disabledCommands: string[] | undefined;
  environment: 'development' | 'production';
  databaseUrl: string;
  statusType: 0 | 1 | 2 | 3 | undefined;
  sentryDSN: string | undefined;
  status: string | undefined;
  owners: string[] | undefined;
  prometheus: number;
  ksoft: string | undefined;
  discord: {
    prefix: string;
    token: string;
  };
  redis: RedisOptions;
  botlists: {
    dservicestoken: string | undefined;
    dboatstoken: string | undefined;
    topggtoken: string | undefined;
    bfdtoken: string | undefined;
    blstoken: string | undefined;
  } | undefined;
  webhook: {
    token: string;
    id: string;
  } | undefined;
  dbAuth: {
    username: string;
    password: string;
  } | undefined;
}

@injectable()
export default class Bot {
  public logger: Logger;
  public owners: string[];
  public client: DiscordClient;
  public config: Config;
  public redis: Redis;

  @lazyInject(CaseSettingsService)
  public cases!: CaseSettingsService;

  @lazyInject(TYPES.LocalizationManager)
  public locales!: LocalizationManager;

  @lazyInject(TYPES.DatabaseManager)
  public database!: DatabaseManager;

  @lazyInject(TYPES.CommandManager)
  public manager!: CommandManager;

  @lazyInject(TYPES.TimeoutsManager)
  public timeouts!: TimeoutsManager;

  @lazyInject(TYPES.AutoModService)
  public automod!: AutomodService;

  @lazyInject(TYPES.EventManager)
  public events!: EventManager;

  @lazyInject(TYPES.BotListService)
  public botlists!: BotListService;

  @lazyInject(TYPES.GuildSettingsService)
  public settings!: GuildSettingsService;

  @lazyInject(TYPES.StatusManager)
  public status!: StatusManager;

  @lazyInject(TYPES.CommandStatisticsManager)
  public statistics!: CommandStatisticsManager;

  @lazyInject(TYPES.PunishmentService)
  public punishments!: PunishmentService;

  @lazyInject(TYPES.UserSettingsService)
  public userSettings!: UserSettingsService;

  constructor(
    @inject(TYPES.Config) config: Config,
    @inject(TYPES.Client) client: DiscordClient 
  ) {
    this.config = config;
    this.client = client;
    this.owners = config.owners || [];
    this.logger = new Logger();
    this.redis = new RedisClient(config.redis);
  }

  async build() {
    this.logger.info('Connecting to the database...');
    await this.database.connect();

    this.logger.info('Success! Connecting to the Redis pool...');
    this.addRedisEvents();
    this.addDebugMonitor();
    await this.redis.connect().catch(() => {}); // eslint-disable-line

    this.logger.info('Success! Initializing events...');
    this.events.run();

    this.logger.info('Success! Initializing locales...');
    this.locales.run();

    this.logger.info('Success! Connecting to Discord...');
    await this.client.connect()
      .then(() => this.logger.info('Connecting to Discord...'))
      .catch(ex => this.logger.error(ex));
  }

  dispose() {
    this.database.dispose();
    this.redis.disconnect();
    this.client.disconnect({ reconnect: false });
    this.botlists.stop();

    this.logger.warn('Bot connection was disposed');
  }

  report(ex: any) {
    captureException(ex);
  }

  private addRedisEvents() {
    this.redis.once('ready', () => this.logger.redis(`Created a Redis pool at ${this.config.redis.host}:${this.config.redis.port}${this.config.redis.db ? `, with database ID: ${this.config.redis.db}` : ''}`));
    this.redis.on('wait', () => this.logger.redis('Redis has disconnected and awaiting a new pool...'));
    this.redis.on('error', error => this.logger.redis('Unable to establish a connection with Redis', error));
  }

  private addDebugMonitor() {
    if (this.config.environment === 'development') {
      this.logger.info('Environment is in development mode, adding monitoring with Redis...');
      this.redis.monitor((error, monitor) => {
        if (error) this.logger.error('Unable to initialize the debug monitor', error);

        this.logger.info('Initialized monitoring!');
        monitor.on('monitor', (time: number, args: string[]) => {
          const date = new Date(Math.floor(time) * 1000);
          const command = args.shift()!;

          this.logger.redis(`At ${date.toDateString()}, we executed command ${command.toUpperCase()} with args "${args.join(':')}"`);
        });
      });
    }
  }
}
