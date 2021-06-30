import { MigrationInterface, QueryRunner } from 'typeorm';

export class fixCaseTimeType1621895533962 implements MigrationInterface {
  name = 'fixCaseTimeType1621895533962'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "cases" DROP COLUMN "time"');
    await queryRunner.query('ALTER TABLE "cases" ADD "time" bigint');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "cases" DROP COLUMN "time"');
    await queryRunner.query('ALTER TABLE "cases" ADD "time" integer');
  }

}
