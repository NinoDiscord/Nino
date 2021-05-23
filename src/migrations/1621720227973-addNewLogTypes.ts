import { MigrationInterface, QueryRunner } from 'typeorm';
import { LoggingEvents } from '../entities/LoggingEntity';

const NewTypes = [
  'voice_member_muted',
  'voice_member_deafened'
];

export class addNewLogTypes1621720227973 implements MigrationInterface {
  name = 'addNewLogTypes1621720227973';

  public async up(runner: QueryRunner) {
    await runner.query('ALTER TYPE "logging_events_enum" RENAME TO "logging_events_enum_old";');
    await runner.query(`CREATE TYPE "logging_events_enum" AS ENUM(${Object.values(LoggingEvents).map(value => `'${value}'`).join(', ')});`);
    await runner.query('ALTER TABLE "logging" ALTER COLUMN "events" DROP DEFAULT;');
    await runner.query('ALTER TABLE "logging" ALTER COLUMN "events" TYPE "logging_events_enum"[] USING "events"::"text"::"logging_events_enum"[];');
    await runner.query('ALTER TABLE "logging" ALTER COLUMN "events" SET DEFAULT \'{}\';');
    await runner.query('DROP TYPE "logging_events_enum_old";');
  }

  public async down(runner: QueryRunner) {
    await runner.query(`CREATE TYPE "logging_events_enum_old" AS ENUM(${Object.values(LoggingEvents).filter(v => !NewTypes.includes(v)).map(value => `'${value}'`).join(', ')});`);
    await runner.query('ALTER TABLE "logging" ALTER COLUMN "events" DROP DEFAULT;');
    await runner.query('ALTER TABLE "logging" ALTER COLUMN "events" TYPE "logging_events_enum_old"[] USING "events"::"text"::"logging_events_enum_old"[];');
    await runner.query('DROP TYPE "logging_events_enum";');
    await runner.query('ALTER TYPE "logging_events_enum_old" RENAME TO "logging_events_enum";');
  }
}
