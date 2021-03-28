import { MigrationInterface, QueryRunner } from 'typeorm';

export class compositePrimaryColumn1616925236662 implements MigrationInterface {
    name = 'compositePrimaryColumn1616925236662'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "cases" DROP CONSTRAINT "PK_1fdc077ce253c084e66315d8058"');
      await queryRunner.query('ALTER TABLE "cases" ADD CONSTRAINT "PK_70fc7fe12ee1488af12aaea83af" PRIMARY KEY ("guild_id", "index")');
      await queryRunner.query('COMMENT ON COLUMN "cases"."index" IS NULL');
      await queryRunner.query('CREATE SEQUENCE "cases_index_seq" OWNED BY "cases"."index"');
      await queryRunner.query('ALTER TABLE "cases" ALTER COLUMN "index" SET DEFAULT nextval(\'cases_index_seq\')');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."modlog_channel_id" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlog_channel_id" SET DEFAULT null');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."muted_role_id" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "muted_role_id" SET DEFAULT null');
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
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "muted_role_id" DROP DEFAULT');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."muted_role_id" IS NULL');
      await queryRunner.query('ALTER TABLE "guilds" ALTER COLUMN "modlog_channel_id" DROP DEFAULT');
      await queryRunner.query('COMMENT ON COLUMN "guilds"."modlog_channel_id" IS NULL');
      await queryRunner.query('ALTER TABLE "cases" ALTER COLUMN "index" DROP DEFAULT');
      await queryRunner.query('DROP SEQUENCE "cases_index_seq"');
      await queryRunner.query('COMMENT ON COLUMN "cases"."index" IS NULL');
      await queryRunner.query('ALTER TABLE "cases" DROP CONSTRAINT "PK_70fc7fe12ee1488af12aaea83af"');
      await queryRunner.query('ALTER TABLE "cases" ADD CONSTRAINT "PK_1fdc077ce253c084e66315d8058" PRIMARY KEY ("guild_id")');
    }

}
