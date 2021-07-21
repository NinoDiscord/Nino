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

export class firstMigration1617402812079 implements MigrationInterface {
  name = 'firstMigration1617402812079'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "automod" ADD "shortLinks" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TYPE "logging_events_enum" RENAME TO "logging_events_enum_old"');
    await queryRunner.query('CREATE TYPE "logging_events_enum" AS ENUM(\'voice_channel_switch\', \'voice_channel_left\', \'voice_channel_join\', \'message_delete\', \'message_update\')');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" DROP DEFAULT');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" TYPE "logging_events_enum"[] USING "events"::"text"::"logging_events_enum"[]');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" SET DEFAULT \'{}\'');
    await queryRunner.query('DROP TYPE "logging_events_enum_old"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TYPE "logging_events_enum_old" AS ENUM(\'voice_channel_switch\', \'voice_channel_left\', \'voice_channel_join\', \'message_delete\', \'message_update\', \'settings_update\')');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" DROP DEFAULT');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" TYPE "logging_events_enum_old"[] USING "events"::"text"::"logging_events_enum_old"[]');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" SET DEFAULT \'{}\'');
    await queryRunner.query('DROP TYPE "logging_events_enum"');
    await queryRunner.query('ALTER TYPE "logging_events_enum_old" RENAME TO "logging_events_enum"');
    await queryRunner.query('ALTER TABLE "automod" DROP COLUMN "shortLinks"');
  }

}
