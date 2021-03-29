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

import type { TextChannel } from 'eris';
import { ID_REGEX } from '../../util/Constants';
import { Router } from '@augu/http';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import Config from '../../components/Config';
import app from '../../container';

const database: Database = app.$ref<any>(Database);
const discord: Discord = app.$ref<any>(Discord);
const config: Config = app.$ref<any>(Config);
const router = new Router('/guilds');

router.get('/', (_, res) => res.status(404).json({
  message: 'Missing :id path param'
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

  if (!discord.client.guilds.has(req.params.guild))
    return res.status(404).json({
      message: `Guild "${req.params.guild}" was not found.`
    });

  const settings = await database.guilds.get(req.params.guild, false);
  const modlogChannel = settings?.modlogChannelID !== undefined ? await discord.getChannel<TextChannel>(settings.modlogChannelID) : undefined;
  const mutedRole = settings?.mutedRoleID !== undefined ? await discord.getRole(settings.mutedRoleID, discord.client.guilds.get(req.params.guild)!) : undefined;
  const message = settings !== undefined ? {
    modlog_channel_id: modlogChannel !== undefined && modlogChannel !== null ? {
      name: modlogChannel.name,
      id: modlogChannel.id
    } : undefined,
    muted_role_id: mutedRole !== undefined && mutedRole !== null ? {
      name: mutedRole.name,
      id: mutedRole.id
    } : undefined,
    prefixes: settings.prefixes,
    language: settings.language,
    guild_id: settings.guildID
  } : { message: `Settings for guild "${req.params.guild}" was not found.` };

  return res.status(settings !== undefined ? 200 : 404).json(message);
});

router.get('/:guild/automod', async (req, res) => {
  if (!ID_REGEX.test(req.params.guild))
    return res.status(406).json({
      message: `Guild '${req.params.guild}' was not a Snowflake`
    });

  const secret = config.getProperty('api.secret')!;
  if (req.headers.authorization !== secret)
    return res.status(401).json({
      message: 'You are not authorized to see this information, unfortunately.'
    });

  if (!discord.client.guilds.has(req.params.guild))
    return res.status(404).json({
      message: `Guild "${req.params.guild}" was not found.`
    });

  const automod = await database.automod.get(req.params.guild);
  const message = automod !== undefined ? {
    blacklist: {
      enabled: automod.blacklist,
      list: automod.blacklistWords
    },

    mentions: automod.mentions,
    invites: automod.invites,
    dehoist: automod.dehoist,
    spam: automod.spam,
    raid: automod.raid
  } : { message: 'Automod was not found.' };

  return res.status(automod !== undefined ? 200 : 404).json(message);
});

export default router;
