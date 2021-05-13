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

import { Component, Inject } from '@augu/lilith';
import { Db, MongoClient } from 'mongodb';
import { Logger } from 'tslog';
import Config from './Config';

import CasesSchema from '../schemas/CasesSchema';

@Component({
  priority: 1,
  name: 'database'
})
export default class Database {
  public blacklists!: BlacklistSchema;
  public warnings!: WarningSchema;
  public guilds!: GuildSchema;
  public users!: UserSchema;
  public cases!: CasesSchema;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly config!: Config;

  @Inject
  private mongo!: MongoClient;

  @Inject
  public db!: Db;

  async load() {
    const url = this.config.getProperty('database.url');
    if (url === undefined)
      throw new SyntaxError('Um, this may seem weird but... you forgot to set the URL of your Mongo instance.');

    const db = this.config.getProperty('database.db') ?? 'nino';
    const needCredentials = (
      this.config.getProperty('database.username') !== undefined &&
      this.config.getProperty('database.password') !== undefined
    );

    this.logger.info('Connecting to MongoDB...');
    this.mongo = new MongoClient(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      auth: needCredentials ? {
        password: this.config.getProperty('database.password')!,
        user: this.config.getProperty('database.username')!
      } : undefined
    });

    return this.mongo.connect()
      .then(() => {
        this.initSchemas();
        this.db = this.mongo.db(db);
        this.logger.info(`Connected to MongoDB with URI: "${url}" with database "${db}"`);
      });
  }

  get connected() {
    return this.mongo.isConnected();
  }

  dispose() {
    return this.mongo.close();
  }

  private initSchemas() {
    this.cases = new CasesSchema(this);
  }
}
