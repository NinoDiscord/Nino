import { MigrationInterface, QueryRunner } from 'typeorm';

export class addPTypes1616390152801 implements MigrationInterface {
    name = 'addPTypes1616390152801'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('COMMENT ON COLUMN "guilds"."modlogChannelID" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlogChannelID" SET DEFAULT null');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."mutedRoleID" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "mutedRoleID" SET DEFAULT null');
      await queryRunner.query('COMMENT ON COLUMN "logging"."ignoreChannels" IS NULL');
      await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "ignoreChannels" SET DEFAULT \'{}\'::text[]');
      await queryRunner.query('COMMENT ON COLUMN "logging"."ignoreUsers" IS NULL');
      await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "ignoreUsers" SET DEFAULT \'{}\'::text[]');
      await queryRunner.query('ALTER TYPE "public"."punishments_type_enum" RENAME TO "punishments_type_enum_old"');
      await queryRunner.query('CREATE TYPE "punishments_type_enum" AS ENUM(\'voice.deafen\', \'role.remove\', \'voice.mute\', \'role.add\', \'unmute\', \'unban\', \'kick\', \'mute\', \'ban\')');
      await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "type" TYPE "punishments_type_enum" USING "type"::"text"::"punishments_type_enum"');
      await queryRunner.query('DROP TYPE "punishments_type_enum_old"');
      await queryRunner.query('COMMENT ON COLUMN "punishments"."type" IS NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('COMMENT ON COLUMN "punishments"."type" IS NULL');
      await queryRunner.query('CREATE TYPE "punishments_type_enum_old" AS ENUM(\'role.remove\', \'role.add\', \'unmute\', \'unban\', \'kick\', \'ban\')');
      await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "type" TYPE "punishments_type_enum_old" USING "type"::"text"::"punishments_type_enum_old"');
      await queryRunner.query('DROP TYPE "punishments_type_enum"');
      await queryRunner.query('ALTER TYPE "punishments_type_enum_old" RENAME TO  "punishments_type_enum"');
      await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "ignoreUsers" SET DEFAULT \'{}\'');
      await queryRunner.query('COMMENT ON COLUMN "logging"."ignoreUsers" IS NULL');
      await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "ignoreChannels" SET DEFAULT \'{}\'');
      await queryRunner.query('COMMENT ON COLUMN "logging"."ignoreChannels" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "mutedRoleID" DROP DEFAULT');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."mutedRoleID" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlogChannelID" DROP DEFAULT');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."modlogChannelID" IS NULL');
    }

}
