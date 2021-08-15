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

/* eslint-disable camelcase */

const { mkdir, writeFile } = require('fs/promises');
const { LoggerWithoutCallSite } = require('tslog');
const { createConnection } = require('typeorm');
const { existsSync } = require('fs');
const { join } = require('path');

const { default: PunishmentsEntity } = require('../build/entities/PunishmentsEntity');
const { default: AutomodEntity } = require('../build/entities/AutomodEntity');
const { default: CaseEntity } = require('../build/entities/CaseEntity');
const { default: GuildEntity } = require('../build/entities/GuildEntity');
const { default: WarningsEntity } = require('../build/entities/WarningsEntity');
const { default: LoggingEntity } = require('../build/entities/LoggingEntity');
const { default: UserEntity } = require('../build/entities/UserEntity');

const logger = new LoggerWithoutCallSite({
  displayFunctionName: true,
  exposeErrorCodeFrame: true,
  displayInstanceName: true,
  displayFilePath: false,
  dateTimePattern: '[ day-month-year / hour:minute:second ]',
  instanceName: 'script: v0 -> v1',
  name: 'scripts',
});

/*
export function* withIndex<T extends any[]>(arr: T): Generator<[index: number, item: T[any]]> {
  for (let i = 0; i < arr.length; i++) {
    yield [i, arr[i]];
  }
}
*/

const main = async () => {
  logger.info('Welcome to the export script for migrating from v1 -> v2.');

  const key = `.nino/migration-${Date.now()}.json`;
  const connection = await createConnection();
  logger.info(`Established the connection with PostgreSQL. I will be exporting data in ${key}, hold tight!`);

  if (!existsSync(join(process.cwd(), '.nino'))) await mkdir(join(process.cwd(), '.nino'));

  const guilds = await connection.getRepository(GuildEntity).find();
  const users = await connection.getRepository(UserEntity).find();
  const punishments = await connection.getRepository(PunishmentsEntity).find();
  const automod = await connection.getRepository(AutomodEntity).find();
  const cases = await connection.getRepository(CaseEntity).find();
  const warnings = await connection.getRepository(WarningsEntity).find();
  const logging = await connection.getRepository(LoggingEntity).find();

  logger.info('Retrieved all entities! Now exporting...');
  const data = {
    version: 1,
    ran_at: Date.now(),
    blame: require('os').userInfo().username.replace('cutie', 'Noel'),
    data: {},
  };

  // First, let's do cases (since some might be broken...)
  logger.info(`Found ${cases.length} cases~`);
  for (const model of cases) {
    if (!data.data.hasOwnProperty('cases')) data.data.cases = [];

    data.data.cases.push({
      attachments: model.attachments,
      moderator_id: model.moderatorID,
      message_id: model.messageID,
      victim_id: model.victimID,
      guild_id: model.guildID,
      reason: model.reason,
      index: model.index,
      soft: model.soft,
      time: model.time,
    });
  }

  await writeFile(key, JSON.stringify(data, null, '\t'));
};

main();
