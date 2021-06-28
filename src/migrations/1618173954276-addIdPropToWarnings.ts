import { MigrationInterface, QueryRunner } from 'typeorm';

export class addIdPropToWarnings1618173954276 implements MigrationInterface {
  name = 'addIdPropToWarnings1618173954276'

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
