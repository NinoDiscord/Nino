import { MigrationInterface, QueryRunner } from 'typeorm';

export class addDaysColumn1625457655665 implements MigrationInterface {
  name = 'addDaysColumn1625457655665';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "punishments" ADD "days" integer');
    await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "index" DROP DEFAULT');
    await queryRunner.query('DROP SEQUENCE IF EXISTS "punishments_index_seq"');
    await queryRunner.query('ALTER TYPE "punishments_type_enum" RENAME TO "punishments_type_enum_old"');
    await queryRunner.query('CREATE TYPE "punishments_type_enum" AS ENUM(\'warning.removed\', \'voice.undeafen\', \'warning.added\', \'voice.unmute\', \'voice.deafen\', \'voice.mute\', \'unmute\', \'unban\', \'kick\', \'mute\', \'ban\')');
    await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "type" TYPE "punishments_type_enum" USING "type"::"text"::"punishments_type_enum"');
    await queryRunner.query('DROP TYPE "punishments_type_enum_old"');
    await queryRunner.query('ALTER TYPE "cases_type_enum" RENAME TO "cases_type_enum_old"');
    await queryRunner.query('CREATE TYPE "cases_type_enum" AS ENUM(\'warning.removed\', \'voice.undeafen\', \'warning.added\', \'voice.unmute\', \'voice.deafen\', \'voice.mute\', \'unmute\', \'unban\', \'kick\', \'mute\', \'ban\')');
    await queryRunner.query('ALTER TABLE "cases" ALTER COLUMN "type" TYPE "cases_type_enum" USING "type"::"text"::"cases_type_enum"');
    await queryRunner.query('DROP TYPE "cases_type_enum_old"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TYPE "cases_type_enum_old" AS ENUM(\'warning.removed\', \'voice.undeafen\', \'warning.added\', \'voice.unmute\', \'voice.deafen\', \'voice.kick\', \'voice.mute\', \'unmute\', \'unban\', \'kick\', \'mute\', \'ban\')');
    await queryRunner.query('ALTER TABLE "cases" ALTER COLUMN "type" TYPE "cases_type_enum_old" USING "type"::"text"::"cases_type_enum_old"');
    await queryRunner.query('DROP TYPE "cases_type_enum"');
    await queryRunner.query('ALTER TYPE "cases_type_enum_old" RENAME TO "cases_type_enum"');
    await queryRunner.query('CREATE TYPE "punishments_type_enum_old" AS ENUM(\'warning.removed\', \'voice.undeafen\', \'warning.added\', \'voice.unmute\', \'voice.deafen\', \'voice.kick\', \'voice.mute\', \'unmute\', \'unban\', \'kick\', \'mute\', \'ban\')');
    await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "type" TYPE "punishments_type_enum_old" USING "type"::"text"::"punishments_type_enum_old"');
    await queryRunner.query('DROP TYPE "punishments_type_enum"');
    await queryRunner.query('ALTER TYPE "punishments_type_enum_old" RENAME TO "punishments_type_enum"');
    await queryRunner.query('CREATE SEQUENCE "punishments_index_seq" OWNED BY "punishments"."index"');
    await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "index" SET DEFAULT nextval(\'punishments_index_seq\')');
    await queryRunner.query('ALTER TABLE "punishments" DROP COLUMN "days"');
  }

}
