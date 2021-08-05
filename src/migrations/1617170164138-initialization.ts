/**
 * Copyright (c) 2019-2021 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class initialization1617170164138 implements MigrationInterface {
  name = 'initialization1617170164138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "automod" ("blacklistWords" text array NOT NULL, "blacklist" boolean NOT NULL DEFAULT false, "mentions" boolean NOT NULL DEFAULT false, "invites" boolean NOT NULL DEFAULT false, "dehoist" boolean NOT NULL DEFAULT false, "guild_id" character varying NOT NULL, "spam" boolean NOT NULL DEFAULT false, "raid" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_8592ba75741fd8ff52adde5de53" PRIMARY KEY ("guild_id"))'
    );
    await queryRunner.query("CREATE TYPE \"blacklists_type_enum\" AS ENUM('0', '1')");
    await queryRunner.query(
      'CREATE TABLE "blacklists" ("reason" character varying, "issuer" character varying NOT NULL, "type" "blacklists_type_enum" NOT NULL, "id" character varying NOT NULL, CONSTRAINT "PK_69894f41b74b226aae9ea763bc2" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      "CREATE TYPE \"punishments_type_enum\" AS ENUM('warning.removed', 'voice.undeafen', 'warning.added', 'voice.unmute', 'voice.deafen', 'voice.mute', 'unmute', 'unban', 'kick', 'mute', 'ban')"
    );
    await queryRunner.query(
      'CREATE TABLE "punishments" ("warnings" integer NOT NULL DEFAULT \'1\', "guild_id" character varying NOT NULL, "index" SERIAL NOT NULL, "soft" boolean NOT NULL DEFAULT false, "time" integer, "type" "punishments_type_enum" NOT NULL, CONSTRAINT "PK_b08854374ef88515861c1bf6cd8" PRIMARY KEY ("guild_id", "index"))'
    );
    await queryRunner.query(
      "CREATE TYPE \"cases_type_enum\" AS ENUM('warning.removed', 'voice.undeafen', 'warning.added', 'voice.unmute', 'voice.deafen', 'voice.mute', 'unmute', 'unban', 'kick', 'mute', 'ban')"
    );
    await queryRunner.query(
      'CREATE TABLE "cases" ("moderator_id" character varying NOT NULL, "message_id" character varying, "victim_id" character varying NOT NULL, "guild_id" character varying NOT NULL, "reason" character varying, "index" integer NOT NULL, "type" "cases_type_enum" NOT NULL, "soft" boolean NOT NULL DEFAULT false, "time" integer, CONSTRAINT "PK_70fc7fe12ee1488af12aaea83af" PRIMARY KEY ("guild_id", "index"))'
    );
    await queryRunner.query(
      'CREATE TABLE "guilds" ("modlog_channel_id" character varying DEFAULT null, "muted_role_id" character varying DEFAULT null, "prefixes" text array NOT NULL, "language" character varying NOT NULL DEFAULT \'en_US\', "guild_id" character varying NOT NULL, CONSTRAINT "PK_e8887ee637b1f465673e957dd0a" PRIMARY KEY ("guild_id"))'
    );
    await queryRunner.query(
      "CREATE TYPE \"logging_events_enum\" AS ENUM('voice_channel_switch', 'voice_channel_left', 'voice_channel_join', 'message_delete', 'message_update', 'settings_update')"
    );
    await queryRunner.query(
      'CREATE TABLE "logging" ("ignoreChannels" text array NOT NULL DEFAULT \'{}\'::text[], "ignoreUsers" text array NOT NULL DEFAULT \'{}\'::text[], "channel_id" character varying, "enabled" boolean NOT NULL DEFAULT false, "events" "logging_events_enum" array NOT NULL DEFAULT \'{}\', "guild_id" character varying NOT NULL, CONSTRAINT "PK_cbd7eb1495206472bb71b7a6d68" PRIMARY KEY ("guild_id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "users" ("language" character varying NOT NULL DEFAULT \'en_US\', "prefixes" text array NOT NULL, "user_id" character varying NOT NULL, CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "warnings" ("guild_id" character varying NOT NULL, "reason" character varying, "amount" integer NOT NULL DEFAULT \'0\', "user_id" character varying NOT NULL, CONSTRAINT "PK_7a14eba00a6aaf0dc04f76aff02" PRIMARY KEY ("user_id"))'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "warnings"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TABLE "logging"');
    await queryRunner.query('DROP TYPE "logging_events_enum"');
    await queryRunner.query('DROP TABLE "guilds"');
    await queryRunner.query('DROP TABLE "cases"');
    await queryRunner.query('DROP TYPE "cases_type_enum"');
    await queryRunner.query('DROP TABLE "punishments"');
    await queryRunner.query('DROP TYPE "punishments_type_enum"');
    await queryRunner.query('DROP TABLE "blacklists"');
    await queryRunner.query('DROP TYPE "blacklists_type_enum"');
    await queryRunner.query('DROP TABLE "automod"');
  }
}
