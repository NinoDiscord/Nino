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

export class snakeCaseColumnNames1618174668865 implements MigrationInterface {
  name = 'snakeCaseColumnNames1618174668865'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "automod" DROP COLUMN "blacklistWords"');
    await queryRunner.query('ALTER TABLE "automod" DROP COLUMN "shortLinks"');
    await queryRunner.query('ALTER TABLE "logging" DROP COLUMN "ignoreChannels"');
    await queryRunner.query('ALTER TABLE "logging" DROP COLUMN "ignoreUsers"');
    await queryRunner.query('ALTER TABLE "automod" ADD "blacklist_words" text array NOT NULL DEFAULT \'{}\'');
    await queryRunner.query('ALTER TABLE "automod" ADD "short_links" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE "logging" ADD "ignore_channels" text array NOT NULL DEFAULT \'{}\'');
    await queryRunner.query('ALTER TABLE "logging" ADD "ignore_users" text array NOT NULL DEFAULT \'{}\'');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "logging" DROP COLUMN "ignore_users"');
    await queryRunner.query('ALTER TABLE "logging" DROP COLUMN "ignore_channels"');
    await queryRunner.query('ALTER TABLE "automod" DROP COLUMN "short_links"');
    await queryRunner.query('ALTER TABLE "automod" DROP COLUMN "blacklist_words"');
    await queryRunner.query('ALTER TABLE "logging" ADD "ignoreUsers" text array NOT NULL DEFAULT \'{}\'');
    await queryRunner.query('ALTER TABLE "logging" ADD "ignoreChannels" text array NOT NULL DEFAULT \'{}\'');
    await queryRunner.query('ALTER TABLE "automod" ADD "shortLinks" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE "automod" ADD "blacklistWords" text array NOT NULL');
  }

}
