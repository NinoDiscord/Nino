import { MigrationInterface, QueryRunner } from 'typeorm';

export class fixPrimaryColumnInWarnings1618173354506 implements MigrationInterface {
  name = 'fixPrimaryColumnInWarnings1618173354506'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "warnings" DROP CONSTRAINT "PK_7a14eba00a6aaf0dc04f76aff02"');
    await queryRunner.query('ALTER TABLE "warnings" ADD CONSTRAINT "PK_cb17dc8ac1439c8d9bfb89ea41a" PRIMARY KEY ("user_id", "guild_id")');
    await queryRunner.query('ALTER TABLE "warnings" DROP CONSTRAINT "PK_cb17dc8ac1439c8d9bfb89ea41a"');
    await queryRunner.query('ALTER TABLE "warnings" ADD CONSTRAINT "PK_acfe1e5e5e9ba6b9b0fa3f591fa" PRIMARY KEY ("guild_id")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "warnings" DROP CONSTRAINT "PK_acfe1e5e5e9ba6b9b0fa3f591fa"');
    await queryRunner.query('ALTER TABLE "warnings" ADD CONSTRAINT "PK_cb17dc8ac1439c8d9bfb89ea41a" PRIMARY KEY ("guild_id", "user_id")');
    await queryRunner.query('ALTER TABLE "warnings" DROP CONSTRAINT "PK_cb17dc8ac1439c8d9bfb89ea41a"');
    await queryRunner.query('ALTER TABLE "warnings" ADD CONSTRAINT "PK_7a14eba00a6aaf0dc04f76aff02" PRIMARY KEY ("user_id")');
  }

}
