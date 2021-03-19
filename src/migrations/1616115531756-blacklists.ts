import { MigrationInterface, QueryRunner } from 'typeorm';

export class blacklists1616115531756 implements MigrationInterface {
    name = 'blacklists1616115531756'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('CREATE TYPE "blacklists_type_enum" AS ENUM(\'0\', \'1\')');
      await queryRunner.query('CREATE TABLE "blacklists" ("reason" character varying, "issuer" character varying NOT NULL, "type" "blacklists_type_enum" NOT NULL, "id" character varying NOT NULL, CONSTRAINT "PK_69894f41b74b226aae9ea763bc2" PRIMARY KEY ("id"))');
      await queryRunner.query('ALTER TABLE "punishments" ADD "guild_id" character varying NOT NULL');
      await queryRunner.query('ALTER TABLE "punishments" DROP CONSTRAINT "PK_0b9bcdb6d57bc70c84fce412332"');
      await queryRunner.query('ALTER TABLE "punishments" ADD CONSTRAINT "PK_b08854374ef88515861c1bf6cd8" PRIMARY KEY ("index", "guild_id")');
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
      await queryRunner.query('ALTER TABLE "punishments" DROP CONSTRAINT "PK_b08854374ef88515861c1bf6cd8"');
      await queryRunner.query('ALTER TABLE "punishments" ADD CONSTRAINT "PK_0b9bcdb6d57bc70c84fce412332" PRIMARY KEY ("index")');
      await queryRunner.query('ALTER TABLE "punishments" DROP COLUMN "guild_id"');
      await queryRunner.query('DROP TABLE "blacklists"');
      await queryRunner.query('DROP TYPE "blacklists_type_enum"');
    }

}
