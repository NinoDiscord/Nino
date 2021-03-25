import { MigrationInterface, QueryRunner } from 'typeorm';

export class why1616649349962 implements MigrationInterface {
    name = 'why1616649349962'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "guilds" DROP COLUMN "modlogChannelID"');
      await queryRunner.query('ALTER TABLE "guilds" DROP COLUMN "mutedRoleID"');
      await queryRunner.query('ALTER TABLE "guilds" ADD "modlog_channel_id" character varying DEFAULT null');
      await queryRunner.query('ALTER TABLE "guilds" ADD "muted_role_id" character varying DEFAULT null');
      await queryRunner.query('COMMENT ON COLUMN "cases"."index" IS NULL');
      await queryRunner.query('ALTER TABLE "cases" DROP CONSTRAINT "PK_70fc7fe12ee1488af12aaea83af"');
      await queryRunner.query('ALTER TABLE "cases" ADD CONSTRAINT "PK_1fdc077ce253c084e66315d8058" PRIMARY KEY ("guild_id")');
      await queryRunner.query('ALTER TABLE "cases" ALTER COLUMN "index" DROP DEFAULT');
      await queryRunner.query('DROP SEQUENCE "cases_index_seq"');
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
      await queryRunner.query('CREATE SEQUENCE "cases_index_seq" OWNED BY "cases"."index"');
      await queryRunner.query('ALTER TABLE "cases" ALTER COLUMN "index" SET DEFAULT nextval(\'cases_index_seq\')');
      await queryRunner.query('ALTER TABLE "cases" DROP CONSTRAINT "PK_1fdc077ce253c084e66315d8058"');
      await queryRunner.query('ALTER TABLE "cases" ADD CONSTRAINT "PK_70fc7fe12ee1488af12aaea83af" PRIMARY KEY ("guild_id", "index")');
      await queryRunner.query('COMMENT ON COLUMN "cases"."index" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" DROP COLUMN "muted_role_id"');
      await queryRunner.query('ALTER TABLE "guilds" DROP COLUMN "modlog_channel_id"');
      await queryRunner.query('ALTER TABLE "guilds" ADD "mutedRoleID" character varying');
      await queryRunner.query('ALTER TABLE "guilds" ADD "modlogChannelID" character varying');
    }

}
