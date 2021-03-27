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
import { PunishmentType } from '../entities/PunishmentsEntity';
import type Database from '../components/Database';
import CaseEntity from '../entities/CaseEntity';

interface CreateCaseOptions {
  moderatorID: string;
  victimID: string;
  guildID: string;
  reason?: string;
  soft?: boolean;
  time?: number;
  type: PunishmentType;
}

export default class CasesController {
  constructor(private database: Database) {}

  private get repository() {
    return this.database.connection.getRepository(CaseEntity);
  }

  get(guildID: string, caseID: number) {
    return this.repository.findOne({ guildID, index: caseID });
  }

  getAll(guildID: string) {
    return this.repository.find({ guildID });
  }

  async create({
    moderatorID,
    victimID,
    guildID,
    reason,
    soft,
    time,
    type
  }: CreateCaseOptions) {
    const cases = await this.getAll(guildID);
    const index = cases[cases.length - 1].index + 1;

    const entry = new CaseEntity();
    entry.moderatorID = moderatorID;
    entry.victimID = victimID;
    entry.guildID = guildID;
    entry.index = index;
    entry.soft = soft === true; // if it's undefined, then it'll be false so no ternaries :crab:
    entry.type = type;

    if (reason !== undefined)
      entry.reason = reason;

    if (time !== undefined)
      entry.time = time;

    return this.repository.save(entry);
  }

  update(guildID: string, index: number, values: QueryDeepPartialEntity<CaseEntity>) {
    return this
      .database
      .connection
      .createQueryBuilder()
      .update(CaseEntity)
      .set(values)
      .where('guild_id = :id', { id: guildID })
      .andWhere('index = :idx', { idx: index })
      .execute();
  }
}
