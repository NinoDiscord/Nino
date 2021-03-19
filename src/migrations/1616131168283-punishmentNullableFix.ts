import { MigrationInterface, QueryRunner } from 'typeorm';

export class punishmentNullableFix1616131168283 implements MigrationInterface {
    name = 'punishmentNullableFix1616131168283'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('COMMENT ON COLUMN "guilds"."modlogChannelID" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlogChannelID" SET DEFAULT null');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."mutedRoleID" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "mutedRoleID" SET DEFAULT null');
      await queryRunner.query('COMMENT ON COLUMN "logging"."ignoreChannels" IS NULL');
      await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "ignoreChannels" SET DEFAULT \'{}\'::text[]');
      await queryRunner.query('COMMENT ON COLUMN "logging"."ignoreUsers" IS NULL');
      await queryRunner.query('ALTER TABLE "logging" ALTER COLUMN "ignoreUsers" SET DEFAULT \'{}\'::text[]');
      await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "roleID" DROP NOT NULL');
      await queryRunner.query('COMMENT ON COLUMN "punishments"."roleID" IS NULL');
      await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "time" DROP NOT NULL');
      await queryRunner.query('COMMENT ON COLUMN "punishments"."time" IS NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('COMMENT ON COLUMN "punishments"."time" IS NULL');
      await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "time" SET NOT NULL');
      await queryRunner.query('COMMENT ON COLUMN "punishments"."roleID" IS NULL');
      await queryRunner.query('ALTER TABLE "punishments" ALTER COLUMN "roleID" SET NOT NULL');
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
