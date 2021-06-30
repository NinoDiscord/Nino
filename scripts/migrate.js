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

const { LoggerWithoutCallSite } = require('tslog');
const { calculateHRTime, readdir } = require('@augu/utils');
const determineCaseType = require('./util/getCaseType');
const getRepositories = require('./util/getRepositories');
const { resolve, sep } = require('path');
const { existsSync } = require('fs');
const { readFile } = require('fs/promises');
const { createConnection } = require('typeorm');

const { default: PunishmentsEntity } = require('../build/entities/PunishmentsEntity');
const { default: AutomodEntity } = require('../build/entities/AutomodEntity');
const { default: CaseEntity } = require('../build/entities/CaseEntity');
const { default: GuildEntity } = require('../build/entities/GuildEntity');
const { default: WarningsEntity } = require('../build/entities/WarningsEntity');
const { default: LoggingEntity, LoggingEvents } = require('../build/entities/LoggingEntity');
const { default: UserEntity } = require('../build/entities/UserEntity');

const argv = process.argv.slice(2);
const logger = new LoggerWithoutCallSite({
  displayFunctionName: true,
  exposeErrorCodeFrame: true,
  displayInstanceName: true,
  displayFilePath: false,
  dateTimePattern: '[ day-month-year / hour:minute:second ]',
  instanceName: 'script: v0 -> v1',
  name: 'scripts'
});

async function main() {
  logger.info('Welcome to the database conversion script!');
  logger.info('This script takes care of converting the Mongo database to the PostgreSQL one!');

  if (argv[0] === undefined) {
    logger.fatal('You are required to output a directory after `node scripts/migrate.js`.');
    process.exit(1);
  }

  const directory = argv[0];
  if (!existsSync(directory)) {
    logger.fatal(`Directory ${argv[0]} doesn't exist.`);
    process.exit(1);
  }

  const files = await readdir(directory);
  if (!files.every(file => file.endsWith('.json'))) {
    logger.fatal('Every file should end with ".json"');
    process.exit(1);
  }

  logger.info('Creating PostgreSQL instance...');
  const connection = await createConnection();

  const startTime = process.hrtime();
  const guilds = files.find(file => file.endsWith('guilds.json'));
  const guildData = await readFile(guilds, 'utf-8');
  const guildDocs = JSON.parse(guildData);
  await convertGuilds(connection, guildDocs);

  const users = files.find(file => file.endsWith('users.json'));
  const userData = await readFile(users, 'utf-8');
  const userDocs = JSON.parse(userData);
  await convertUsers(connection, userDocs);

  const warnings = files.find(file => file.endsWith('warnings.json'));
  const warningData = await readFile(warnings, 'utf-8');
  const warningDocs = JSON.parse(warningData);
  await convertWarnings(connection, warningDocs);

  const cases = files.find(file => file.endsWith('cases.json'));
  const caseData = await readFile(cases, 'utf-8');
  const caseDocs = JSON.parse(caseData);
  await convertCases(connection, caseDocs);

  logger.info(`Converted ${userDocs.length} users, ${guildDocs.length} guilds, ${warningDocs.length} warnings, and ${caseDocs.length} cases in ~${calculateHRTime(startTime)}ms.`);
  process.exit(0);
}

async function convertGuilds(connection, documents) {
  logger.info(`Found ${documents.length} documents to convert...`);
  const { guilds, punishments, automod, logging } = getRepositories(connection);

  const start = process.hrtime();
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];

    logger.info(`Guild Entry: ${document.guildID} ${i + 1}/${documents.length}`);
    const entry = new GuildEntity();
    entry.language = document.locale;
    entry.prefixes = [document.prefix];
    entry.guildID = document.guildID;

    if (document.modlog !== undefined)
      entry.modlogChannelID = document.modlog;

    if (document.mutedRole !== undefined)
      entry.mutedRoleID = document.mutedRole;

    const available = await guilds.findOne({ guildID: document.guildID });
    if (!available)
      await guilds.save(entry);

    logger.info(`Converting ${document.punishments.length} punishments...`);
    for (const punishment of document.punishments) {
      if (punishment.type === 'unrole' || punishment.type === 'role') {
        logger.warn('Removing legacy punishment...', punishment);
        continue;
      }

      const entry = new PunishmentsEntity();
      entry.warnings = punishment.warnings;
      entry.guildID = document.guildID;
      entry.soft = punishment.soft === true;
      entry.type = determineCaseType(punishment.type);

      if (punishment.temp !== null)
        entry.time = punishment.temp;

      const available = await punishments.findOne({ guildID: document.guildID, warnings: punishment.warnings });
      if (!available)
        await punishments.save(entry);
    }

    logger.info('Converting automod actions...');
    const automodEntry = new AutomodEntity();
    automodEntry.blacklistWords = automod.badwords?.wordlist ?? [];
    automodEntry.blacklist = automod.badwords?.enabled ?? false;
    automodEntry.mentions = automod.mention ?? false;
    automodEntry.invites = automod.invites ?? false;
    automodEntry.dehoist = automod.dehoist ?? false;
    automodEntry.guildID = document.guildID;
    automodEntry.spam = automod.spam ?? false;
    automodEntry.raid = automod.raid ?? false;

    const aeiou = await automod.findOne({ guildID: document.guildID });
    if (!aeiou)
      await automod.save(automodEntry);

    logger.info('Converting logging actions...');
    const loggingEntry = new LoggingEntity();
    loggingEntry.guildID = document.guildID;

    const _logging = document.logging ?? { enabled: false };
    if (!_logging.enabled) {
      loggingEntry.enabled = false;
      const owoDaUwu = await logging.findOne({ guildID: document.guildID });
      if (!owoDaUwu)
        await logging.save(loggingEntry);
    } else {
      const events = [];

      loggingEntry.enabled = true;
      loggingEntry.channelID = _logging.channelID ?? null;
      loggingEntry.ignoreUsers = _logging.ignoreChannels ?? [];
      loggingEntry.ignoreChannels = _logging.ignore ?? [];

      if (_logging.events.messageDelete === true)
        events.push(LoggingEvents.MessageDeleted);

      if (_logging.events.messageUpdate === true)
        events.push(LoggingEvents.MessageUpdated);

      const owoDaUwu = await logging.findOne({ guildID: document.guildID });
      if (!owoDaUwu)
        await logging.save(loggingEntry);
    }
  }

  logger.info(`Hopefully migrated ${documents.length} guild documents (~${calculateHRTime(start).toFixed(2)}ms)`);
}

async function convertUsers(connection, documents) {
  logger.info(`Found ${documents.length} users to convert.`);
  const { users } = getRepositories(connection);

  const startTime = process.hrtime();
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    logger.info(`User Entry: ${document.userID} (${i + 1}/${documents.length})`);

    const entry = new UserEntity();
    entry.language = document.locale;
    entry.prefixes = [];
    entry.id = document.userID;

    const user = await users.find({ id: document.userID });
    if (!user)
      await users.save(entry);
  }

  logger.info(`Hopefully migrated ${documents.length} user documents (~${calculateHRTime(startTime).toFixed(2)}ms)`);
}

async function convertWarnings(connection, documents) {
  logger.info(`Found ${documents.length} warnings to convert.`);
  const { warnings } = getRepositories(connection);

  const startTime = process.hrtime();
  for (let i = 0; i < documents.length; i++) {
    logger.info(`Warning Entry: ${documents[i].guild} | ${documents[i].user} (${i + 1}/${documents.length})`);

    const document = documents[i];
    const entry = new WarningsEntity();

    entry.amount = document.amount;
    entry.guildID = document.guild;
    entry.userID = document.user;
    if (typeof document.reason === 'string')
      entry.reason = document.reason;

    const aeiou = await warnings.findOne({ guildID: document.guild, userID: document.user });
    if (!aeiou)
      await warnings.save(entry);
  }

  logger.info(`Hopefully migrated ${documents.length} warning documents (~${calculateHRTime(startTime).toFixed(2)}ms)`);
}

async function convertCases(connection, documents) {
  logger.info(`Found ${documents.length} cases to convert.`);
  const { cases } = getRepositories(connection);

  const startTime = process.hrtime();
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    logger.info(`Case Entry: ${document.guild}, ${document.victim}, #${document.id}`);

    const entry = new CaseEntity();
    entry.moderatorID = document.moderator;
    entry.messageID = document.message;
    entry.victimID = document.victim;
    entry.guildID = document.guild;
    entry.index = document.id;
    entry.type = determineCaseType(document.type) ?? document.type;
    entry.soft = document.soft === true;

    if (document.reason !== null)
      entry.reason = document.reason;

    if (document.time !== undefined)
      entry.time = document.time;

    const available = await cases.findOne({ guildID: document.guild, index: document.index });
    if (!available) {
      try {
        await cases.save(entry);
      } catch(ex) {
        logger.info(`Skipping on entity #${document.id}: `, ex);
        continue;
      }
    }
  }

  logger.info(`Hopefully migrated ${documents.length} case documents (~${calculateHRTime(startTime).toFixed(2)}ms)`);
}

main()
  .then(process.exit)
  .catch(ex => {
    logger.fatal(ex);
    process.exit(1);
  });
