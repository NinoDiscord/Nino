import { MigrationInterface, QueryRunner } from 'typeorm';

export class fixPunishmentTypes1616517588406 implements MigrationInterface {
    name = 'fixPunishmentTypes1616517588406'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TYPE "public"."punishments_type_enum" RENAME TO "punishments_type_enum_old"');
      await queryRunner.query('CREATE TYPE "punishments_type_enum" AS ENUM(\'warning.removed\', \'voice.undeafen\', \'warning.added\', \'voice.unmute\', \'voice.deafen\', \'voice.mute\', \'unmute\', \'unban\', \'kick\', \'mute\', \'ban\')');
      await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "type" TYPE "punishments_type_enum" USING "type"::"text"::"punishments_type_enum"');
      await queryRunner.query('DROP TYPE "punishments_type_enum_old"');
      await queryRunner.query('COMMENT ON COLUMN "punishments"."type" IS NULL');
      await queryRunner.query('ALTER TYPE "public"."cases_type_enum" RENAME TO "cases_type_enum_old"');
      await queryRunner.query('CREATE TYPE "cases_type_enum" AS ENUM(\'warning.removed\', \'voice.undeafen\', \'warning.added\', \'voice.unmute\', \'voice.deafen\', \'voice.mute\', \'unmute\', \'unban\', \'kick\', \'mute\', \'ban\')');
      await queryRunner.query('ALTER TABLE "cases" ALTER COLUMN "type" TYPE "cases_type_enum" USING "type"::"text"::"cases_type_enum"');
      await queryRunner.query('DROP TYPE "cases_type_enum_old"');
      await queryRunner.query('COMMENT ON COLUMN "cases"."type" IS NULL');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."modlogChannelID" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlogChannelID" SET DEFAULT null');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."mutedRoleID" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "mutedRoleID" SET DEFAULT null');
      await queryRunner.query('COMMENT ON COLUMN "logging"."ignoreChannels" IS NULL');
      await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "ignoreChannels" SET DEFAULT \'{}\'::text[]');
      await queryRunner.query('COMMENT ON COLUMN "logging"."ignoreUsers" IS NULL');
      await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "ignoreUsers" SET DEFAULT \'{}\'::text[]');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "ignoreUsers" SET DEFAULT \'{}\'');
      await queryRunner.query('COMMENT ON COLUMN "logging"."ignoreUsers" IS NULL');
      await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "ignoreChannels" SET DEFAULT \'{}\'');
      await queryRunner.query('COMMENT ON COLUMN "logging"."ignoreChannels" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "mutedRoleID" DROP DEFAULT');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."mutedRoleID" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlogChannelID" DROP DEFAULT');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."modlogChannelID" IS NULL');
      await queryRunner.query('COMMENT ON COLUMN "cases"."type" IS NULL');
      await queryRunner.query('CREATE TYPE "cases_type_enum_old" AS ENUM(\'warning_remove\', \'warning_add\', \'unmute\', \'unban\', \'kick\', \'ban\')');
      await queryRunner.query('ALTER TABLE "cases" ALTER COLUMN "type" TYPE "cases_type_enum_old" USING "type"::"text"::"cases_type_enum_old"');
      await queryRunner.query('DROP TYPE "cases_type_enum"');
      await queryRunner.query('ALTER TYPE "cases_type_enum_old" RENAME TO  "cases_type_enum"');
      await queryRunner.query('COMMENT ON COLUMN "punishments"."type" IS NULL');
      await queryRunner.query('CREATE TYPE "punishments_type_enum_old" AS ENUM(\'voice.undeafen\', \'voice.unmute\', \'voice.deafen\', \'voice.mute\', \'unmute\', \'unban\', \'kick\', \'mute\', \'ban\')');
      await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "type" TYPE "punishments_type_enum_old" USING "type"::"text"::"punishments_type_enum_old"');
      await queryRunner.query('DROP TYPE "punishments_type_enum"');
      await queryRunner.query('ALTER TYPE "punishments_type_enum_old" RENAME TO  "punishments_type_enum"');
    }

}
