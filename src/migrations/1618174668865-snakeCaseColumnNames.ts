import { MigrationInterface, QueryRunner } from 'typeorm';

export class snakeCaseColumnNames1618174668865 implements MigrationInterface {
    name = 'snakeCaseColumnNames1618174668865'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "automod" DROP COLUMN "blacklistWords"');
      await queryRunner.query('ALTER TABLE "automod" DROP COLUMN "shortLinks"');
      await queryRunner.query('ALTER TABLE "logging" DROP COLUMN "ignoreChannels"');
      await queryRunner.query('ALTER TABLE "logging" DROP COLUMN "ignoreUsers"');
      await queryRunner.query('ALTER TABLE "automod" ADD "blacklist_words" text array NOT NULL DEFAULT \'{}\'');
      await queryRunner.query('ALTER TABLE "automod" ADD "short_links" boolean NOT NULL DEFAULT false');
      await queryRunner.query('ALTER TABLE "logging" ADD "ignore_channels" text array NOT NULL DEFAULT \'{}\'');
      await queryRunner.query('ALTER TABLE "logging" ADD "ignore_users" text array NOT NULL DEFAULT \'{}\'');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "logging" DROP COLUMN "ignore_users"');
      await queryRunner.query('ALTER TABLE "logging" DROP COLUMN "ignore_channels"');
      await queryRunner.query('ALTER TABLE "automod" DROP COLUMN "short_links"');
      await queryRunner.query('ALTER TABLE "automod" DROP COLUMN "blacklist_words"');
      await queryRunner.query('ALTER TABLE "logging" ADD "ignoreUsers" text array NOT NULL DEFAULT \'{}\'');
      await queryRunner.query('ALTER TABLE "logging" ADD "ignoreChannels" text array NOT NULL DEFAULT \'{}\'');
      await queryRunner.query('ALTER TABLE "automod" ADD "shortLinks" boolean NOT NULL DEFAULT false');
      await queryRunner.query('ALTER TABLE "automod" ADD "blacklistWords" text array NOT NULL');
    }

}
