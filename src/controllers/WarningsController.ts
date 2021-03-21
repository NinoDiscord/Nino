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

import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import WarningEntity from '../entities/WarningsEntity';
import type Database from '../components/Database';

interface CreateWarningOptions {
  userID: string;
  guildID: string;
  reason?: string;
  amount: number;
  caseID: string;
}

export default class WarningsController {
  constructor(private database: Database) {}

  private get repository() {
    return this.database.connection.getRepository(WarningEntity);
  }

  getAll(guildID: string, userID: string) {
    return this.repository.find({ guildID, userID });
  }

  create({ guildID, userID, reason, amount, caseID }: CreateWarningOptions) {
    if (amount < 0)
      throw new RangeError('amount index out of bounds');

    const entry = new WarningEntity();
    entry.guildID = guildID;
    entry.caseID = caseID;
    entry.reason = reason;
    entry.amount = amount;
    entry.userID = userID;

    return this.repository.save(entry);
  }

  update(guildID: string, userID: string, values: QueryDeepPartialEntity<WarningEntity>) {
    return this
      .database
      .connection
      .createQueryBuilder()
      .update(WarningEntity)
      .set(values)
      .where('guild_id = :id', { id: guildID })
      .andWhere('user_id = :id', { id: userID })
      .execute();
  }
}
