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

import { createConnection, Connection, ConnectionOptions } from 'typeorm';
import { Component, ComponentAPI, Inject } from '@augu/lilith';
import { humanize, Stopwatch } from '@augu/utils';
import { Logger } from 'tslog';
import Config from './Config';

// Controllers
import GuildSettingsController from '../controllers/GuildSettingsController';
import UserSettingsController from '../controllers/UserSettingsController';
import PunishmentsController from '../controllers/PunishmentsController';
import BlacklistController from '../controllers/BlacklistController';
import WarningsController from '../controllers/WarningsController';
import LoggingController from '../controllers/LoggingController';
import AutomodController from '../controllers/AutomodController';
import CasesController from '../controllers/CasesController';

// Import entities
import PunishmentEntity from '../entities/PunishmentsEntity';
import BlacklistEntity from '../entities/BlacklistEntity';
import LoggingEntity from '../entities/LoggingEntity';
import WarningEntity from '../entities/WarningsEntity';
import AutomodEntity from '../entities/AutomodEntity';
import GuildEntity from '../entities/GuildEntity';
import CaseEntity from '../entities/CaseEntity';
import UserEntity from '../entities/UserEntity';

@Component({
  priority: 1,
  name: 'database',
})
export default class Database {
  public punishments!: PunishmentsController;
  public blacklists!: BlacklistController;
  public connection!: Connection;
  public warnings!: WarningsController;
  public logging!: LoggingController;
  public automod!: AutomodController;
  public guilds!: GuildSettingsController;
  public cases!: CasesController;
  public users!: UserSettingsController;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly config!: Config;
  private api!: ComponentAPI;

  async load() {
    this.logger.info('Now connecting to the database...');

    const url = this.config.getProperty('database.url');
    const entities = [
      // readability mmmmm
      PunishmentEntity,
      BlacklistEntity,
      LoggingEntity,
      WarningEntity,
      AutomodEntity,
      GuildEntity,
      CaseEntity,
      UserEntity,
    ];

    const config: ConnectionOptions =
      url !== undefined
        ? {
            migrations: ['./migrations/*.ts'],
            entities,
            type: 'postgres',
            name: 'Nino',
            url,
          }
        : {
            migrations: ['./migrations/*.ts'],
            username: this.config.getProperty('database.username'),
            password: this.config.getProperty('database.password'),
            database: this.config.getProperty('database.database'),
            entities,
            host: this.config.getProperty('database.host'),
            port: this.config.getProperty('database.port'),
            type: 'postgres',
            name: 'Nino',
          };

    this.connection = await createConnection(config);
    this.initRepos();

    const migrations = await this.connection.showMigrations();
    const shouldRun = this.config.getProperty('runPendingMigrations');
    if (migrations && (shouldRun === undefined || shouldRun === false)) {
      this.logger.info(
        'There are pending migrations to be ran, but you have `runPendingMigrations` disabled! Run `npm run migrations` to migrate the database or set `runPendingMigrations` = true to run them at runtime.'
      );
    } else if (migrations && shouldRun === true) {
      this.logger.info('Found pending migrations and `runPendingMigrations` is enabled, now running...');

      try {
        const ran = await this.connection.runMigrations({ transaction: 'all' });
        this.logger.info(`Ran ${ran.length} migrations! You're all to go.`);
      } catch (ex) {
        this.logger.fatal(ex);

        if ((ex as any).message.indexOf('already exists') !== -1) {
          this.logger.warn('Seems like relations or indexes existed!');
          return Promise.resolve();
        }

        return Promise.reject(ex);
      }
    } else {
      this.logger.info('No migrations needs to be ran and the connection to the database is healthy.');
      return Promise.resolve();
    }

    this.logger.info('All migrations has been migrated and the connection has been established correctly!');
    return Promise.resolve();
  }

  dispose() {
    return this.connection.close();
  }

  async getStatistics() {
    const stopwatch = new Stopwatch();
    stopwatch.start();
    await this.connection.query('SELECT * FROM guilds');
    const ping = stopwatch.end();

    let dbName: string = 'nino';
    const url = this.config.getProperty('database.url');
    if (url !== undefined) {
      const parts = url.split('/');
      dbName = parts[parts.length - 1];
    } else {
      dbName = this.config.getProperty('database.database') ?? 'nino';
    }

    // collect shit
    const data = await Promise.all([
      this.connection.query(
        `SELECT tup_returned, tup_fetched, tup_inserted, tup_updated, tup_deleted FROM pg_stat_database WHERE datname = '${dbName}';`
      ),
      this.connection.query('SELECT version();'),
      this.connection.query('SELECT extract(epoch FROM current_timestamp - pg_postmaster_start_time()) AS uptime;'),
    ]);

    return {
      inserted: Number(data[0]?.[0]?.tup_inserted ?? 0),
      updated: Number(data[0]?.[0]?.tup_updated ?? 0),
      deleted: Number(data[0]?.[0]?.tup_deleted ?? 0),
      fetched: Number(data[0]?.[0]?.tup_fetched ?? 0),
      version: data[1][0].version.split(', ').shift().replace('PostgreSQL ', '').trim(),
      uptime: humanize(Math.floor(data[2][0].uptime * 1000), true),
      ping,
    };
  }

  private initRepos() {
    this.punishments = new PunishmentsController(this);
    this.blacklists = new BlacklistController(this);
    this.warnings = new WarningsController(this);
    this.logging = new LoggingController(this);
    this.automod = new AutomodController(this);
    this.guilds = new GuildSettingsController(this);
    this.cases = new CasesController(this);
    this.users = new UserSettingsController(this);

    for (const controller of [
      this.punishments,
      this.blacklists,
      this.warnings,
      this.logging,
      this.automod,
      this.guilds,
      this.cases,
      this.users,
    ]) {
      this.api.container.addInjections(controller);
    }
  }
}
