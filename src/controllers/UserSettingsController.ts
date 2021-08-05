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

import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import type Database from '../components/Database';
import UserEntity from '../entities/UserEntity';

export default class UserSettingsController {
  constructor(private database: Database) {}

  get repository() {
    return this.database.connection.getRepository(UserEntity);
  }

  async get(id: string) {
    const settings = await this.repository.findOne({ id });
    if (settings === undefined) {
      const entry = new UserEntity();
      entry.prefixes = [];
      entry.language = 'en_US';
      entry.id = id;

      await this.repository.save(entry);
      return entry;
    }

    return settings;
  }

  update(userID: string, values: QueryDeepPartialEntity<UserEntity>) {
    return this.database.connection
      .createQueryBuilder()
      .update(UserEntity)
      .set(values)
      .where('user_id = :id', { id: userID })
      .execute();
  }
}
