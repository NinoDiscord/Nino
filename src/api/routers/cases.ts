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

import type PunishmentService from '../../services/PunishmentService';
import type Database from '../../components/Database';
import { ID_REGEX } from '../../util/Constants';
import type Discord from '../../components/Discord';
import type Config from '../../components/Config';
import { Router } from '@augu/http';
import app from '../../container';
import ms = require('ms');

const router = new Router('/cases');

const punishments: PunishmentService = app.services.get('punishments') as PunishmentService;
const database: Database = app.components.get('Database') as Database;
const discord: Discord = app.components.get('Discord') as Discord;
const config: Config = app.components.get('Config') as Config;

router.get('/', (_, res) => res.status(404).send({
  message: 'Missing :guild path param.'
}));

router.get('/:guild', async (req, res) => {
  if (!ID_REGEX.test(req.params.guild))
    return res.status(406).json({
      message: `Guild '${req.params.guild}' was not a Snowflake`
    });

  const secret = config.getProperty('api.secret')!;
  if (req.headers.authorization !== secret)
    return res.status(401).json({
      message: 'You are not authorized to see this information, unfortunately.'
    });

  const cases = await database.cases.getAll(req.params.guild);
  return res.status(200).json(cases.map(caseModel => ({
    moderator_id: caseModel.moderatorID,
    message_id: caseModel.messageID,
    victim_id: caseModel.victimID,
    guild_id: caseModel.guildID,
    reason: caseModel.reason ?? 'No reason was specified.',
    index: caseModel.index,
    type: caseModel.type,
    soft: caseModel.soft,
    time: caseModel.time
  })));
});

router.get('/:guild/:case', async (req, res) => {
  if (!ID_REGEX.test(req.params.guild))
    return res.status(406).json({
      message: `Guild '${req.params.guild}' was not a Snowflake`
    });

  const secret = config.getProperty('api.secret')!;
  if (req.headers.authorization !== secret)
    return res.status(401).json({
      message: 'You are not authorized to see this information, unfortunately.'
    });

  const caseID = Number(req.params.case);
  if (isNaN(caseID))
    return res.status(406).json({
      message: `Case "${req.params.case}" was not a number`
    });

  const caseModel = await database.cases.get(req.params.guild, caseID);
  const message = caseModel !== undefined ? {
    moderator_id: caseModel.moderatorID,
    message_id: caseModel.messageID,
    victim_id: caseModel.victimID,
    guild_id: caseModel.guildID,
    reason: caseModel.reason ?? 'No reason was specified.',
    index: caseModel.index,
    type: caseModel.type,
    soft: caseModel.soft,
    time: caseModel.time
  } : {
    message: `Case #${caseID} doesn't exist in guild.`
  };

  return res.status(caseModel !== undefined ? 200 : 404).json(message);
});

router.patch('/:guild/:case', async (req, res) => {
  if (!ID_REGEX.test(req.params.guild))
    return res.status(406).json({
      message: `Guild '${req.params.guild}' was not a Snowflake`
    });

  const secret = config.getProperty('api.secret')!;
  if (req.headers.authorization !== secret)
    return res.status(401).json({
      message: 'You are not authorized to see this information, unfortunately.'
    });

  const caseID = Number(req.params.case);
  if (isNaN(caseID))
    return res.status(406).json({
      message: `Case "${req.params.case}" was not a number`
    });

  const caseModel = await database.cases.get(req.params.guild, caseID);
  if (caseModel === undefined)
    return res.status(404).json({
      message: `Case #${caseID} was not found`
    });

  if (!req.body)
    return res.status(406).json({
      message: 'Missing payload'
    });

  if (req.body.time !== undefined) {
    const time = ms(req.body.time);
    if (time === undefined)
      return res.status(406).json({
        message: `Time "${req.body.time}" was invalid. If you're using months, use \`30d\` (1 month) instead.`
      });

    caseModel.time = ms(time);
  }

  if (req.body.reason !== undefined)
    caseModel.reason = req.body.reason;

  const settings = await database.guilds.get(req.params.guild);
  if (settings.modlogChannelID === undefined) {
    await database.cases['repository'].save(caseModel);
    return res.status(204).send();
  }

  const message = await discord.client.getMessage(settings.modlogChannelID, caseModel.messageID!);
  await punishments.editModLog(caseModel, message);
  return res.status(204).send();
});

export default router;
