import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeCaseID1616427992025 implements MigrationInterface {
    name = 'removeCaseID1616427992025'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "warnings" DROP COLUMN "case_id"');
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
      await queryRunner.query('ALTER TABLE "warnings" ADD "case_id" character varying NOT NULL');
    }

}
