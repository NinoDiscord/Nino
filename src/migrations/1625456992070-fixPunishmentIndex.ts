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

export class fixPunishmentIndex1625456992070 implements MigrationInterface {
  name = 'fixPunishmentIndex1625456992070';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "index" DROP DEFAULT');
    await queryRunner.query('DROP SEQUENCE "punishments_index_seq"');
    await queryRunner.query('ALTER TYPE "punishments_type_enum" RENAME TO "punishments_type_enum_old"');
    await queryRunner.query(
      "CREATE TYPE \"punishments_type_enum\" AS ENUM('warning.removed', 'voice.undeafen', 'warning.added', 'voice.unmute', 'voice.deafen', 'voice.mute', 'unmute', 'unban', 'kick', 'mute', 'ban')"
    );
    await queryRunner.query(
      'ALTER TABLE "punishments" ALTER COLUMN "type" TYPE "punishments_type_enum" USING "type"::"text"::"punishments_type_enum"'
    );
    await queryRunner.query('DROP TYPE "punishments_type_enum_old"');
    await queryRunner.query('ALTER TYPE "cases_type_enum" RENAME TO "cases_type_enum_old"');
    await queryRunner.query(
      "CREATE TYPE \"cases_type_enum\" AS ENUM('warning.removed', 'voice.undeafen', 'warning.added', 'voice.unmute', 'voice.deafen', 'voice.mute', 'unmute', 'unban', 'kick', 'mute', 'ban')"
    );
    await queryRunner.query(
      'ALTER TABLE "cases" ALTER COLUMN "type" TYPE "cases_type_enum" USING "type"::"text"::"cases_type_enum"'
    );
    await queryRunner.query('DROP TYPE "cases_type_enum_old"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"cases_type_enum_old\" AS ENUM('warning.removed', 'voice.undeafen', 'warning.added', 'voice.unmute', 'voice.deafen', 'voice.kick', 'voice.mute', 'unmute', 'unban', 'kick', 'mute', 'ban')"
    );
    await queryRunner.query(
      'ALTER TABLE "cases" ALTER COLUMN "type" TYPE "cases_type_enum_old" USING "type"::"text"::"cases_type_enum_old"'
    );
    await queryRunner.query('DROP TYPE "cases_type_enum"');
    await queryRunner.query('ALTER TYPE "cases_type_enum_old" RENAME TO "cases_type_enum"');
    await queryRunner.query(
      "CREATE TYPE \"punishments_type_enum_old\" AS ENUM('warning.removed', 'voice.undeafen', 'warning.added', 'voice.unmute', 'voice.deafen', 'voice.kick', 'voice.mute', 'unmute', 'unban', 'kick', 'mute', 'ban')"
    );
    await queryRunner.query(
      'ALTER TABLE "punishments" ALTER COLUMN "type" TYPE "punishments_type_enum_old" USING "type"::"text"::"punishments_type_enum_old"'
    );
    await queryRunner.query('DROP TYPE "punishments_type_enum"');
    await queryRunner.query('ALTER TYPE "punishments_type_enum_old" RENAME TO "punishments_type_enum"');
    await queryRunner.query('CREATE SEQUENCE "punishments_index_seq" OWNED BY "punishments"."index"');
    await queryRunner.query(
      'ALTER TABLE "punishments" ALTER COLUMN "index" SET DEFAULT nextval(\'punishments_index_seq\')'
    );
  }
}
