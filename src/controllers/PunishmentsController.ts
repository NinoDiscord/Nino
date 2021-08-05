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

import PunishmentEntity, { PunishmentType } from '../entities/PunishmentsEntity';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import Database from '../components/Database';

interface CreatePunishmentOptions {
  warnings: number;
  guildID: string;
  soft?: boolean;
  time?: number;
  days?: number;
  type: PunishmentType;
}

export default class PunishmentsController {
  constructor(private database: Database) {}

  private get repository() {
    return this.database.connection.getRepository(PunishmentEntity);
  }

  async create({ warnings, guildID, soft, time, days, type }: CreatePunishmentOptions) {
    const all = await this.getAll(guildID);
    const entry = new PunishmentEntity();
    entry.warnings = warnings;
    entry.guildID = guildID;
    entry.index = all.length + 1; // increment by 1
    entry.type = type;

    if (soft !== undefined && soft === true) entry.soft = true;

    if (time !== undefined) entry.time = time;

    if (days !== undefined) entry.days = days;

    return this.repository.save(entry);
  }

  getAll(guildID: string) {
    return this.repository.find({ guildID });
  }

  get(guildID: string, index: number) {
    return this.repository.findOne({ guildID, index });
  }

  update(guildID: string, values: QueryDeepPartialEntity<PunishmentEntity>) {
    return this.database.connection
      .createQueryBuilder()
      .update(PunishmentEntity)
      .set(values)
      .where('guild_id = :id', { id: guildID })
      .execute();
  }
}
