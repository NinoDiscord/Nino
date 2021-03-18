import { MigrationInterface, QueryRunner } from 'typeorm';

export class init1616061659029 implements MigrationInterface {
  name = 'init1616061659029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE "automod" ("blacklistWords" text array NOT NULL, "blacklist" boolean NOT NULL DEFAULT false, "mentions" boolean NOT NULL DEFAULT false, "invites" boolean NOT NULL DEFAULT false, "dehoist" boolean NOT NULL DEFAULT false, "guild_id" character varying NOT NULL, "spam" boolean NOT NULL DEFAULT false, "raid" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_8592ba75741fd8ff52adde5de53" PRIMARY KEY ("guild_id"))');
    await queryRunner.query('CREATE TYPE "cases_type_enum" AS ENUM(\'warning_remove\', \'warning_add\', \'unmute\', \'unban\', \'kick\', \'ban\')');
    await queryRunner.query('CREATE TABLE "cases" ("moderator_id" character varying NOT NULL, "message_id" character varying NOT NULL, "victim_id" character varying NOT NULL, "guild_id" character varying NOT NULL, "reason" character varying NOT NULL, "type" "cases_type_enum" NOT NULL, "soft" boolean NOT NULL DEFAULT false, "time" integer NOT NULL, CONSTRAINT "PK_1fdc077ce253c084e66315d8058" PRIMARY KEY ("guild_id"))');
    await queryRunner.query('CREATE TABLE "guilds" ("modlogChannelID" character varying NOT NULL, "mutedRoleID" character varying NOT NULL, "prefixes" text array NOT NULL, "language" character varying NOT NULL DEFAULT \'en_US\', "guild_id" character varying NOT NULL, CONSTRAINT "PK_e8887ee637b1f465673e957dd0a" PRIMARY KEY ("guild_id"))');
    await queryRunner.query('CREATE TYPE "logging_events_enum" AS ENUM(\'message_delete\', \'message_update\', \'settings_update\')');
    await queryRunner.query('CREATE TABLE "logging" ("ignoreChannels" text array NOT NULL DEFAULT \'{}\'::text[], "ignoreUsers" text array NOT NULL DEFAULT \'{}\'::text[], "channel_id" character varying NOT NULL, "events" "logging_events_enum" array NOT NULL, "enabled" boolean NOT NULL DEFAULT false, "guild_id" character varying NOT NULL, CONSTRAINT "PK_cbd7eb1495206472bb71b7a6d68" PRIMARY KEY ("guild_id"))');
    await queryRunner.query('CREATE TYPE "punishments_type_enum" AS ENUM(\'unmute\', \'unban\', \'kick\', \'ban\')');
    await queryRunner.query('CREATE TABLE "punishments" ("warnings" integer NOT NULL DEFAULT \'1\', "roleID" character varying NOT NULL, "index" SERIAL NOT NULL, "soft" boolean NOT NULL DEFAULT false, "time" integer NOT NULL, "type" "punishments_type_enum" NOT NULL, CONSTRAINT "PK_0b9bcdb6d57bc70c84fce412332" PRIMARY KEY ("index"))');
    await queryRunner.query('CREATE TABLE "users" ("language" character varying NOT NULL DEFAULT \'en_US\', "prefixes" text array NOT NULL, "user_id" character varying NOT NULL, CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))');
    await queryRunner.query('CREATE TABLE "warnings" ("guild_id" character varying NOT NULL, "reason" character varying NOT NULL, "amount" integer NOT NULL DEFAULT \'1\', "user_id" character varying NOT NULL, CONSTRAINT "PK_7a14eba00a6aaf0dc04f76aff02" PRIMARY KEY ("user_id"))');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "warnings"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TABLE "punishments"');
    await queryRunner.query('DROP TYPE "punishments_type_enum"');
    await queryRunner.query('DROP TABLE "logging"');
    await queryRunner.query('DROP TYPE "logging_events_enum"');
    await queryRunner.query('DROP TABLE "guilds"');
    await queryRunner.query('DROP TABLE "cases"');
    await queryRunner.query('DROP TYPE "cases_type_enum"');
    await queryRunner.query('DROP TABLE "automod"');
  }
}
