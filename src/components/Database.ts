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

import { createConnection, Connection, Repository, ConnectionOptions } from 'typeorm';
import { Component, Inject } from '@augu/lilith';
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

export default class Database implements Component {
  public punishments!: PunishmentsController;
  public blacklists!: BlacklistController;
  public connection!: Connection;
  public warnings!: WarningsController;
  public logging!: LoggingController;
  public priority: number = 1;
  public automod!: AutomodController;
  public guilds!: GuildSettingsController;
  public cases!: CasesController;
  public users!: UserSettingsController;
  public name: string = 'Database';

  private logger: Logger = new Logger();

  @Inject
  private config!: Config;

  async load() {
    this.logger.info('Now connecting to the database...');

    const url = this.config.getProperty('database.url');
    const entities = [ // readability mmmmm
      PunishmentEntity,
      BlacklistEntity,
      LoggingEntity,
      WarningEntity,
      AutomodEntity,
      GuildEntity,
      CaseEntity,
      UserEntity
    ];

    const config: ConnectionOptions = url !== undefined ? {
      migrations: ['./migrations/*.ts'],
      entities,
      type: 'postgres',
      name: 'Nino',
      url
    } : {
      migrations: ['./migrations/*.ts'],
      username: this.config.getProperty('database.username'),
      password: this.config.getProperty('database.password'),
      database: this.config.getProperty('database.database'),
      entities,
      host: this.config.getProperty('database.host'),
      port: this.config.getProperty('database.port'),
      type: 'postgres',
      name: 'Nino'
    };

    this.connection = await createConnection(config);
    this.initRepos();

    const migrations = await this.connection.showMigrations();
    const shouldRun = this.config.getProperty('runPendingMigrations');
    if (migrations && (shouldRun === undefined || shouldRun === false)) {
      this.logger.info('There are pending migrations to be ran, but you have `runPendingMigrations` disabled! Run `npm run migrations` to migrate the database or set `runPendingMigrations` = true to run them at runtime.');
    } else if (migrations && shouldRun === true) {
      this.logger.info('Found pending migrations and `runPendingMigrations` is enabled, now running...');

      try {
        const ran = await this.connection.runMigrations({ transaction: 'all' });
        this.logger.info(`Ran ${ran.length} migrations! You're all to go.`);
      } catch(ex) {
        if (ex.message.indexOf('already exists') !== -1) {
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
    this.connection.close();
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
  }
}
