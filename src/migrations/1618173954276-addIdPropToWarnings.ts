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

export class addIdPropToWarnings1618173954276 implements MigrationInterface {
  name = 'addIdPropToWarnings1618173954276';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "warnings" ADD "id" SERIAL NOT NULL');
    await queryRunner.query('ALTER TABLE "warnings" DROP CONSTRAINT "PK_acfe1e5e5e9ba6b9b0fa3f591fa"');
    await queryRunner.query('ALTER TABLE "warnings" ADD CONSTRAINT "PK_1a1c969d7e8d8aad2231021420f" PRIMARY KEY ("guild_id", "id")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "warnings" DROP CONSTRAINT "PK_1a1c969d7e8d8aad2231021420f"');
    await queryRunner.query('ALTER TABLE "warnings" ADD CONSTRAINT "PK_acfe1e5e5e9ba6b9b0fa3f591fa" PRIMARY KEY ("guild_id")');
    await queryRunner.query('ALTER TABLE "warnings" DROP COLUMN "id"');
  }
}
