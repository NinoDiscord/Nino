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

import { createConnection, Connection, Repository } from 'typeorm';
import { Component, Inject } from '@augu/lilith';
import { Logger } from 'tslog';
import Config from './Config';

// Import entities
import PunishmentEntity from '../entities/PunishmentsEntity';
import LoggingEntity from '../entities/LoggingEntity';
import WarningEntity from '../entities/WarningsEntity';
import AutomodEntity from '../entities/AutomodEntity';
import GuildEntity from '../entities/GuildEntity';
import CaseEntity from '../entities/CaseEntity';
import UserEntity from '../entities/UserEntity';

export default class Database implements Component {
  private connection!: Connection;

  public punishments!: Repository<PunishmentEntity>;
  public warnings!: Repository<WarningEntity>;
  public logging!: Repository<LoggingEntity>;
  public priority: number = 1;
  public automod!: Repository<AutomodEntity>;
  public guilds!: Repository<GuildEntity>;
  public cases!: Repository<CaseEntity>;
  public users!: Repository<UserEntity>;
  public name: string = 'Database';

  @Inject
  private logger!: Logger;

  @Inject
  private config!: Config;

  async load() {
    this.logger.info('Now connecting to the database...');

    const url = this.config.getProperty('database.url');
    if (url !== undefined) {
      this.logger.info('Found a connection URI string, opting to use that...');
      const connection = await createConnection({
        type: 'postgres',
        url
      });

      if (connection.isConnected) {
        this.logger.warn('Connection already exists, not re-connecting...');
        return;
      }

      this.connection = connection;

      await this.connection.connect();
      this.initRepos();
    }

    const connection = await createConnection({
      username: this.config.getProperty('database.username'),
      password: this.config.getProperty('database.password'),
      database: this.config.getProperty('database.database'),
      host: this.config.getProperty('database.host'),
      port: this.config.getProperty('database.port'),
      type: 'postgres'
    });

    this.connection = connection;
    await this.connection.connect();
    this.initRepos();
  }

  dispose() {
    this.connection.close();
  }

  private initRepos() {
    // idk how to make this cleaner
    // typeorm doesn't provide .getRepositories(EntityLike[]) so uh yea
    this.punishments = this.connection.getRepository(PunishmentEntity);
    this.warnings = this.connection.getRepository(WarningEntity);
    this.logging = this.connection.getRepository(LoggingEntity);
    this.automod = this.connection.getRepository(AutomodEntity);
    this.guilds = this.connection.getRepository(GuildEntity);
    this.cases = this.connection.getRepository(CaseEntity);
    this.users = this.connection.getRepository(UserEntity);
  }
}
