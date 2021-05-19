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

const { calculateHRTime, readdir } = require('@augu/utils');
const { LoggerWithoutCallSite } = require('tslog');
const { createConnection } = require('typeorm');
const { parse } = require('@augu/dotenv');
const { exec } = require('child_process');
const { join } = require('path');
const fs = require('fs/promises');

const { default: PunishmentsEntity, PunishmentType } = require('../build/entities/PunishmentsEntity');
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
  name: 'scripts'
});

const execAsync = (command, options) => new Promise((resolve, reject) => {
  const child = exec(command, options);

  child.stdout.on('data', (chunk) => logger.debug(`stdout (${command}):`, chunk));
  child.stderr.on('data', (chunk) => logger.debug(`stderr (${command}):`, chunk));
  child.on('exit', (code, signal) => {
    const success = code === 0;
    logger.info(`${command}: Command has exited with code ${code}${signal ? `, with signal '${signal}'` : ''}`);

    return success ? resolve() : reject(new Error('Read logs with `stderr` prefixed.'));
  });
});

const startTimer = process.hrtime();
(async() => {
  logger.info('Welcome to the database conversion script!');
  logger.info('This script takes care of converting the Mongo database to the PostgreSQL one!');

  const config = parse({
    delimiter: ',',
    populate: false,
    file: join(__dirname, '..', '.env')
  });

  const mongoTimer = process.hrtime();
  try {
    await import('mongodb');
  } catch(ex) {
    logger.info('Assuming you ran this script once, now installing...');

    await installMongo();
    logger.info('This script will exit, please re-run it using `npm run migrate`!');
    process.exit(0);
  }

  logger.info(`Took ~${calculateHRTime(mongoTimer)}ms to fetch MongoDB dependency`);
  logger.info('Assuming you reloaded the script, now converting...');
  const [client, connection] = await connectToDbs(config);

  const db = client.db(config.MONGO_DB);
  const guilds = db.collection('guilds');
  const cases = db.collection('cases');
  const users = db.collection('users');
  const warnings = db.collection('warnings');
  const repositories = getRepositories(connection);

  // Load in guilds
  const guildDocs = await guilds.find({}).toArray();
  const guildTimer = process.hrtime();

  for (const guild of guildDocs) {
    logger.info(`Found guild ${guild.guildID} to convert to!`);

    // keep these as a variable
    const { punishments, automod } = guild;

    const entry = new GuildEntity();
    entry.language = guild.locale;
    entry.prefixes = [guild.prefix];
    entry.guildID = guild.guildID;

    if (guild.modlog !== undefined)
      entry.modlogChannelID = guild.modlog;

    if (guild.mutedRole !== undefined)
      entry.mutedRoleID = guild.mutedRole;

    const available = await repositories.guilds.findOne({ guildID: guild.guildID });
    if (!available)
      await repositories.guilds.save(entry);

    logger.info(`Converting ${punishments.length} punishments...`);
    for (const punishment of punishments) {
      if (punishment.type === 'unrole' || punishment.type === 'role') {
        logger.warn('Removing legacy punishment...', punishment);
        continue;
      }

      const entry = new PunishmentsEntity();
      entry.warnings = punishment.warnings;
      entry.guildID = guild.guildID;
      entry.soft = punishment.soft === true;
      entry.type = figureOutType(punishment.type);

      if (punishment.temp !== null)
        entry.time = punishment.temp;

      const available = await repositories.punishments.findOne({ guildID: guild.guildID, warnings: punishment.warnings });
      if (!available)
        await repositories.punishments.save(entry);
    }

    logger.info('Converting automod actions...');
    const automodEntry = new AutomodEntity();
    automodEntry.blacklistWords = automod.badwords.wordlist;
    automodEntry.blacklist = automod.badwords.enabled;
    automodEntry.mentions = automod.mention;
    automodEntry.invites = automod.invites;
    automodEntry.dehoist = automod.dehoist;
    automodEntry.guildID = guild.guildID;
    automodEntry.spam = automod.spam;
    automodEntry.raid = automod.raid;

    const aeiou = await repositories.automod.findOne({ guildID: guild.guildID });
    if (!aeiou)
      await repositories.automod.save(automodEntry);
  }

  logger.info(`Took ~${calculateHRTime(guildTimer)}ms to convert guild entries!`);
  logger.info('Now converting user entries...');

  const userTimer = process.hrtime();
  const userDocs = await users.find({}).toArray();

  for (const user of userDocs) {
    logger.info(`Found user ${user.userID}!`);
    const entry = new UserEntity();

    entry.prefixes = [];
    entry.language = entry.locale;
    entry.id = user.userID;

    const available = await repositories.users.findOne({ id: user.userID });
    if (!available)
      await repositories.users.save(entry);
  }

  logger.info(`Took ~${calculateHRTime(userTimer)}ms to populate all user entries`);
  logger.info('Now converting all cases...');

  const casesTimer = process.hrtime();
  const caseDocs = await cases.find({}).toArray();

  for (const c of caseDocs) {
    const entry = new CaseEntity();

    entry.moderatorID = c.moderator;
    entry.messageID = c.message;
    entry.victimID = c.victim;
    entry.guildID = c.guild;
    entry.index = c.id;
    entry.type = figureOutType(c.type) ?? c.type;
    entry.soft = c.soft === true;

    if (c.reason !== null)
      entry.reason = c.reason;

    if (c.time !== undefined)
      entry.time = c.time;

    const available = await repositories.cases.findOne({ guildID: c.guild, index: c.id });
    if (!available)
      await repositories.cases.save(entry);
  }

  logger.info(`Took ~${calculateHRTime(casesTimer)} to convert all cases!`);
  logger.info('Now converting warnings...');

  const warningDocs = await warnings.find({}).toArray();
  const warningTimer = process.hrtime();

  for (const warning of warningDocs) {
    const entry = new WarningsEntity();

    entry.amount = 1; // no amount is specified, assuming it's just 1
    entry.guildID = warning.guild;
    entry.userID = warning.user;

    if (typeof warning.reason === 'string')
      entry.reason = warning.reason;
  }

  logger.info(`Took ~${calculateHRTime(warningTimer)}ms to convert all warnings.`);
  logger.info('Looks like I\'m done here, so I\'ll be going now...');
  logger.info('Before I do that, let me uninstall Mongo...');

  await execAsync('npm uninstall --save mongodb');

  await cleanup([client, connection]);
  logger.info(`Took ~${calculateHRTime(startTimer)}ms to run this script.`);
  process.exit(0);
})();

const installMongo = async () => {
  try {
    await execAsync('npm i mongodb');
  } catch(ex) {
    logger.error(ex);
    process.exit(1);
  }
};

/**
 * Connects to the databases
 * @returns {Promise<[mongo: import('mongodb').MongoClient, postgres: import('typeorm').Connection]>}
 */
const connectToDbs = async (config) => {
  const { default: mongodb } = await import('mongodb');
  const client = new mongodb.MongoClient(config.MONGO_URI, {
    appname: 'Nino: v0 -> v1',
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    await client.connect();
    logger.info('Connected to MongoDB!');
  } catch(ex) {
    logger.error('Unable to connect to Mongo:', ex);
    process.exit(1);
  }

  const postgres = await createConnection();
  logger.info('Connected to PostgreSQL!');

  return [client, postgres];
};

/**
 * Clean-ups the databases
 * @param {[mongo: import('mongodb').MongoClient, postgres: import('typeorm').Connection]} owo
 */
const cleanup = async ([mongo, postgres]) => {
  logger.info('Disposing connections...');

  await postgres.close();
  await mongo.close();
};

/** @param {import('typeorm').Connection} connection */
const getRepositories = (connection) => ({
  punishments: connection.getRepository(PunishmentsEntity),
  warnings: connection.getRepository(WarningsEntity),
  logging: connection.getRepository(LoggingEntity),
  automod: connection.getRepository(AutomodEntity),
  guilds: connection.getRepository(GuildEntity),
  cases: connection.getRepository(CaseEntity),
  users: connection.getRepository(UserEntity)
});

const figureOutType = (type) => {
  switch (type) {
    case 'warning remove':
      return PunishmentType.WarningRemoved;

    case 'warning add':
      return PunishmentType.WarningAdded;

    case 'unmute':
      return PunishmentType.Unmute;

    case 'kick':
      return PunishmentType.Kick;

    case 'mute':
      return PunishmentType.Mute;

    case 'ban':
      return PunishmentType.Ban;
  }
};
