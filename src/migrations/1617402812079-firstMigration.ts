import { MigrationInterface, QueryRunner } from 'typeorm';

export class firstMigration1617402812079 implements MigrationInterface {
  name = 'firstMigration1617402812079'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "automod" ADD "shortLinks" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TYPE "logging_events_enum" RENAME TO "logging_events_enum_old"');
    await queryRunner.query('CREATE TYPE "logging_events_enum" AS ENUM(\'voice_channel_switch\', \'voice_channel_left\', \'voice_channel_join\', \'message_delete\', \'message_update\')');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" DROP DEFAULT');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" TYPE "logging_events_enum"[] USING "events"::"text"::"logging_events_enum"[]');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" SET DEFAULT \'{}\'');
    await queryRunner.query('DROP TYPE "logging_events_enum_old"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TYPE "logging_events_enum_old" AS ENUM(\'voice_channel_switch\', \'voice_channel_left\', \'voice_channel_join\', \'message_delete\', \'message_update\', \'settings_update\')');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" DROP DEFAULT');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" TYPE "logging_events_enum_old"[] USING "events"::"text"::"logging_events_enum_old"[]');
    await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "events" SET DEFAULT \'{}\'');
    await queryRunner.query('DROP TYPE "logging_events_enum"');
    await queryRunner.query('ALTER TYPE "logging_events_enum_old" RENAME TO "logging_events_enum"');
    await queryRunner.query('ALTER TABLE "automod" DROP COLUMN "shortLinks"');
  }

}
