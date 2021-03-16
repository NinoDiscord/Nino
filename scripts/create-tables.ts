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

import { LoggerWithoutCallSite } from 'tslog';
import * as typeorm from 'typeorm';

import PunishmentEntity from '../src/entities/PunishmentsEntity';
import LoggingEntity from '../src/entities/LoggingEntity';
import WarningEntity from '../src/entities/WarningsEntity';
import AutomodEntity from '../src/entities/AutomodEntity';
import GuildEntity from '../src/entities/GuildEntity';
import CaseEntity from '../src/entities/CaseEntity';
import UserEntity from '../src/entities/UserEntity';
import Config from '../src/components/Config';

const argv = process.argv.slice(2);
console.log(argv ?? []);

/*
const logger = new LoggerWithoutCallSite();
const main = async() => {
  logger.info('Running migrations...');

  const config = new Config();
  await config.load();

  const url = config.getProperty('database.url');
  const connConfig: typeorm.ConnectionOptions = url ? {
    migrations: ['../src/migrations/*.ts'],
    entities: [
      PunishmentEntity,
      LoggingEntity,
      WarningEntity,
      AutomodEntity,
      GuildEntity,
      CaseEntity,
      UserEntity
    ],
    name: 'Nino',
    type: 'postgres',
    url
  } : {
    migrations: ['./migrations/*.ts'],
    username: config.getProperty('database.username'),
    password: config.getProperty('database.password'),
    database: config.getProperty('database.database'),
    entities: [
      PunishmentEntity,
      LoggingEntity,
      WarningEntity,
      AutomodEntity,
      GuildEntity,
      CaseEntity,
      UserEntity
    ],
    host: config.getProperty('database.host'),
    port: config.getProperty('database.port'),
    type: 'postgres',
    name: 'Nino'
  };

  const connection = await typeorm.createConnection(connConfig);
  logger.info('Successfully connected to the database!');
};
*/

// Wrapper to create migration files so TypeORM can create them
// TODO: use API if implemented


/*
export async function generateMigration(options: GenerateMigrationOptions): string | undefined {
    connection = await createConnection(options.connectionOptions);
    const sqlInMemory = await connection.driver.createSchemaBuilder().log();
    const upSqls: string[] = [], downSqls: string[] = [];

    // mysql is exceptional here because it uses ` character in to escape names in queries, that's why for mysql
    // we are using simple quoted string instead of template string syntax
    if (connection.driver instanceof MysqlDriver || connection.driver instanceof AuroraDataApiDriver) {
        sqlInMemory.upQueries.forEach(upQuery => {
            upSqls.push("        await queryRunner.query(\"" + upQuery.query.replace(new RegExp(`"`, "g"), `\\"`) + "\", " + JSON.stringify(upQuery.parameters) + ");");
        });
        sqlInMemory.downQueries.forEach(downQuery => {
            downSqls.push("        await queryRunner.query(\"" + downQuery.query.replace(new RegExp(`"`, "g"), `\\"`) + "\", " + JSON.stringify(downQuery.parameters) + ");");
        });
    } else {
        sqlInMemory.upQueries.forEach(upQuery => {
            upSqls.push("        await queryRunner.query(`" + upQuery.query.replace(new RegExp("`", "g"), "\\`") + "`, " + JSON.stringify(upQuery.parameters) + ");");
        });
        sqlInMemory.downQueries.forEach(downQuery => {
            downSqls.push("        await queryRunner.query(`" + downQuery.query.replace(new RegExp("`", "g"), "\\`") + "`, " + JSON.stringify(downQuery.parameters) + ");");
        });
    }

    if (upSqls.length) {
        return getTemplate(args.name as any, timestamp, upSqls, downSqls.reverse());
    } else {
        console.log(chalk.yellow(`No changes in database schema were found - cannot generate a migration. To create a new empty migration use "typeorm migration:create" command`));
    }
}
*/

//main();
