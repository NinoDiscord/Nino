import { MigrationInterface, QueryRunner } from 'typeorm';

export class addAttachmentColumn1622346188448 implements MigrationInterface {
    name = 'addAttachmentColumn1622346188448'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "cases" ADD "attachments" text array NOT NULL DEFAULT \'{}\'');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "cases" DROP COLUMN "attachments"');
    }

}
