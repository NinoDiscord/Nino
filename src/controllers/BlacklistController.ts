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

import BlacklistEntity, { BlacklistType } from '../entities/BlacklistEntity';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import type Database from '../components/Database';

interface CreateBlacklistOptions {
  reason?: string;
  issuer: string;
  type: BlacklistType;
  id: string;
}

export default class BlacklistController {
  constructor(private database: Database) {}

  private get repository() {
    return this.database.connection.getRepository(BlacklistEntity);
  }

  get(id: string) {
    return this.repository.findOne({ id });
  }

  getByType(type: BlacklistType) {
    return this.repository.find({ type });
  }

  create({ reason, issuer, type, id }: CreateBlacklistOptions) {
    const entry = new BlacklistEntity();
    entry.issuer = issuer;
    entry.type = type;
    entry.id = id;

    if (reason !== undefined) entry.reason = reason;

    return this.repository.save(entry);
  }

  delete(id: string) {
    return this.repository.delete({ id });
  }

  update(id: string, values: QueryDeepPartialEntity<BlacklistEntity>) {
    return this.database.connection
      .createQueryBuilder()
      .update(BlacklistEntity)
      .set(values)
      .where('id = :id', { id })
      .execute();
  }
}
