import { MigrationInterface, QueryRunner } from 'typeorm';
import { PunishmentType } from '../entities/PunishmentsEntity';

const NewTypes = [
  'voice.kick'
];

export class newPunishmentType1624838572562 implements MigrationInterface {
  name = 'newPunishmentType1624838572562';

  public async up(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TYPE "punishments_type_enum" RENAME TO "punishments_type_enum_old";');
    await queryRunner.query(`CREATE TYPE "punishments_type_enum" AS ENUM(${Object.values(PunishmentType).map(val => `'${val}'`).join(', ')});`);
    await queryRunner.query('ALTER TABLE "punishments" DROP COLUMN "type";');
    await queryRunner.query('ALTER TABLE "punishments" ADD COLUMN "type" "punishments_type_enum";');
    await queryRunner.query('DROP TYPE "punishments_type_enum_old";');
  }

  public async down(queryRunner: QueryRunner) {
    await queryRunner.query(`CREATE TYPE "punishments_type_enum_old" AS ENUM(${Object.values(PunishmentType).filter(v => !NewTypes.includes(v)).map(v => `'${v}'`).join(', ')});`);
    await queryRunner.query('ALTER TABLE "punishments" DROP COLUMN "type";');
    await queryRunner.query('ALTER TABLE "punishments" ADD COLUMN "type" "punishments_type_enum_old";');
    await queryRunner.query('DROP TYPE "punishments_type_enum";');
    await queryRunner.query('ALTER TYPE "punishments_type_enum_old" RENAME TO "punishments_type_enum";');
  }
}
