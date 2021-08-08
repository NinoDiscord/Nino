import { MigrationInterface, QueryRunner } from 'typeorm';

export class guildIDUnique1628463917115 implements MigrationInterface {
  name = 'guildIDUnique1628463917115';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cases" ADD CONSTRAINT "PK_1fdc077ce253c084e66315d8058" PRIMARY KEY ("guild_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cases" DROP CONSTRAINT "PK_1fdc077ce253c084e66315d8058"`);
  }
}
