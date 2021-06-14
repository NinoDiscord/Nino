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
 * SOFTWA
 * RE.
 */

import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import LoggingEntity from '../entities/LoggingEntity';
import type Database from '../components/Database';

export default class LoggingController {
  constructor(private database: Database) {}

  private get repository() {
    return this.database.connection.getRepository(LoggingEntity);
  }

  async get(guildID: string) {
    const entry = await this.repository.findOne({ guildID });
    if (entry === undefined)
      return this.create(guildID);

    return entry;
  }

  create(guildID: string) {
    const entry = new LoggingEntity();
    entry.ignoreChannels = [];
    entry.ignoreUsers = [];
    entry.enabled = false;
    entry.events = [];
    entry.guildID = guildID;

    return this.repository.save(entry);
  }

  update(guildID: string, values: QueryDeepPartialEntity<LoggingEntity>) {
    return this
      .database
      .connection
      .createQueryBuilder()
      .update(LoggingEntity)
      .set(values)
      .where('guild_id = :id', { id: guildID })
      .execute();
  }
}
