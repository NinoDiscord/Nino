import { MigrationInterface, QueryRunner } from 'typeorm';

export class fixIndexFromBeingPrimary1628463663012 implements MigrationInterface {
  name = 'fixIndexFromBeingPrimary1628463663012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cases" DROP CONSTRAINT "PK_70fc7fe12ee1488af12aaea83af"`);
    await queryRunner.query(
      `ALTER TABLE "cases" ADD CONSTRAINT "PK_1fdc077ce253c084e66315d8058" PRIMARY KEY ("guild_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cases" DROP CONSTRAINT "PK_1fdc077ce253c084e66315d8058"`);
    await queryRunner.query(
      `ALTER TABLE "cases" ADD CONSTRAINT "PK_70fc7fe12ee1488af12aaea83af" PRIMARY KEY ("guild_id", "index")`
    );
  }
}
