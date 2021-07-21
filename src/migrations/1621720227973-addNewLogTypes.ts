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

import { MigrationInterface, QueryRunner } from 'typeorm';
import { LoggingEvents } from '../entities/LoggingEntity';

const NewTypes = [
  'voice_member_muted',
  'voice_member_deafened'
];

export class addNewLogTypes1621720227973 implements MigrationInterface {
  name = 'addNewLogTypes1621720227973';

  public async up(runner: QueryRunner) {
    await runner.query('ALTER TYPE "logging_events_enum" RENAME TO "logging_events_enum_old";');
    await runner.query(`CREATE TYPE "logging_events_enum" AS ENUM(${Object.values(LoggingEvents).map(value => `'${value}'`).join(', ')});`);
    await runner.query('ALTER TABLE "logging" ALTER COLUMN "events" DROP DEFAULT;');
    await runner.query('ALTER TABLE "logging" ALTER COLUMN "events" TYPE "logging_events_enum"[] USING "events"::"text"::"logging_events_enum"[];');
    await runner.query('ALTER TABLE "logging" ALTER COLUMN "events" SET DEFAULT \'{}\';');
    await runner.query('DROP TYPE "logging_events_enum_old";');
  }

  public async down(runner: QueryRunner) {
    await runner.query(`CREATE TYPE "logging_events_enum_old" AS ENUM(${Object.values(LoggingEvents).filter(v => !NewTypes.includes(v)).map(value => `'${value}'`).join(', ')});`);
    await runner.query('ALTER TABLE "logging" ALTER COLUMN "events" DROP DEFAULT;');
    await runner.query('ALTER TABLE "logging" ALTER COLUMN "events" TYPE "logging_events_enum_old"[] USING "events"::"text"::"logging_events_enum_old"[];');
    await runner.query('DROP TYPE "logging_events_enum";');
    await runner.query('ALTER TYPE "logging_events_enum_old" RENAME TO "logging_events_enum";');
  }
}
