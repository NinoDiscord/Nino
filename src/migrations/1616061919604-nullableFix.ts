import { MigrationInterface, QueryRunner } from 'typeorm';

export class nullableFix1616061919604 implements MigrationInterface {
    name = 'nullableFix1616061919604'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlogChannelID" DROP NOT NULL');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."modlogChannelID" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlogChannelID" SET DEFAULT null');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "mutedRoleID" DROP NOT NULL');
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
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "mutedRoleID" SET NOT NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlogChannelID" DROP DEFAULT');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."modlogChannelID" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlogChannelID" SET NOT NULL');
    }

}
