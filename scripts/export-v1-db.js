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

const main = async () => {
  logger.info('Welcome to the export script for migrating from v1 -> v2.');

  const key = `.nino/migration.json`;
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
    data: {
      automod: [],
      cases: [],
      logging: [],
      guilds: [],
      punishments: [],
      warnings: [],
      users: [],
    },
  };

  logger.info(`Found ${cases.length} cases to export!`);
  for (const model of cases) {
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

  logger.info(`Found ${guilds.length.toLocaleString()} guilds to export.`);
  for (const guild of guilds) {
    data.data.guilds.push({
      guild_id: guild.guildID,
      prefixes: guild.prefixes,
      language: guild.language,
      modlog_channel_id: guild.modlogChannelID,
      muted_role_id: guild.mutedRoleID,
    });
  }

  logger.info(`Found ${users.length.toLocaleString()} users.`);
  for (const user of users) {
    data.data.users.push({
      user_id: user.id,
      language: user.language,
      prefixes: user.prefixes,
    });
  }

  logger.info(`Found ${punishments.length.toLocaleString()} punishments.`);
  for (const punishment of punishments) {
    data.data.punishments.push({
      warnings: punishment.warnings,
      guild_id: punishment.guildID,
      index: punishment.index,
      soft: punishment.soft,
      time: punishment.time,
      days: punishment.days,
      type: punishment.type,
    });
  }

  logger.info(`Found ${automod.length.toLocaleString()} guild automod settings.`);
  for (const auto of automod) {
    data.data.automod.push({
      blacklisted_words: auto.blacklistWords,
      short_links: auto.shortLinks,
      blacklist: auto.blacklist,
      mentions: auto.mentions,
      invites: auto.invites,
      dehoisting: auto.dehoist,
      guild_id: auto.guildID,
      spam: auto.spam,
      raid: auto.raid,
    });
  }

  logger.info(`Found ${warnings.length.toLocaleString()} warnings.`);
  for (const warning of warnings) {
    data.data.warnings.push({
      guild_id: warning.guildID,
      reason: warning.reason,
      amount: warning.amount,
      user_id: warning.userID,
      id: warning.id,
    });
  }

  logger.info(`Found ${logging.length.toLocaleString()} guild logging settings.`);
  for (const log of logging) {
    data.data.logging.push({
      ignore_channel_ids: log.ignoreChannels,
      ignore_user_ids: log.ignoreUsers,
      channel_id: log.channelID,
      enabled: log.enabled,
      events: log.events,
      guild_id: log.guildID,
    });
  }

  await writeFile(key, JSON.stringify(data, null, '\t'));
  logger.info(`File has been exported to ${key}!`);
};

main();
