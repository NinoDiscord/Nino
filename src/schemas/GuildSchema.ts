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

import type { Collection } from 'mongodb';
import { PunishmentType } from './CasesSchema';
import Database from '../components/Database';

export interface IGuildSchema {
  punishments: PunishmentsSchema[];
  logging: LoggingSchema;
  automod: AutomodSchema;

  modlogChannelId?: string;
  mutedRoleId?: string;
  prefixes: string[];
  language: string;
  _id: string;
}

const enum LoggingEvents {
  VoiceChannelSwitch = 'voice_channel_switch',
  VoiceChannelLeft = 'voice_channel_left',
  VoiceChannelJoin = 'voice_channel_join',
  MessageDeleted = 'message_delete',
  MessageUpdated = 'message_update'
}

interface LoggingSchema {
  ignoreChannelIds: string[];
  ignoreUserIds: string[];
  channelID?: string;
  enabled: boolean;
  events: LoggingEvents[];
}

interface AutomodSchema {
  blacklistedWords: string[];
  shortLinks: boolean;
  blacklist: boolean;
  mentions: boolean;
  invites: boolean;
  dehoist: boolean;
  spam: boolean;
  raid: boolean;
}

interface PunishmentsSchema {
  warnings: number;
  time?: number;
  soft: boolean;
  type: PunishmentType;
}

export default class GuildSchema {
  private readonly collection: Collection<IGuildSchema>;
  constructor(db: Database) {
    this.collection = db.db.collection('guilds');
  }

  async get(guildID: string, create: boolean = false) {
    let settings = await this.collection.findOne({ _id: guildID });

    // this feels like a regression or side-effect but it's fucking 8pm and
    // i dont want to redo this again AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    // AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    //
    // is it worth it? i dont fucking know!
    if (settings === undefined && create === true) {
      await this.create(guildID);
      return this.collection.findOne({ _id: guildID });
    }

    return settings;
  }

  create(guildID: string) {
    return this.collection.insertOne({
      punishments: [],
      logging: {
        ignoreChannelIds: [],
        ignoreUserIds: [],
        enabled: false,
        events: []
      },
      automod: {
        blacklistedWords: [],
        shortLinks: false,
        blacklist: false,
        mentions: false,
        invites: false,
        dehoist: false,
        spam: false,
        raid: false
      },
      modlogChannelId: undefined,
      mutedRoleId: undefined,
      language: 'en_US',
      prefixes: [],
      _id: guildID
    });
  }

  delete(guildID: string) {
    return this.collection.deleteOne({ _id: guildID });
  }

  update(guildID: string, values: {
    [P in keyof Omit<IGuildSchema, '_id' | 'punishments' | 'automod' | 'logging'>]?: IGuildSchema[P];
  } & {
    [P in keyof AutomodSchema as `automod.${P}`]?: AutomodSchema[P];
  } & {
    [P in keyof LoggingSchema as `logging.${P}`]?: LoggingSchema[P];
  }) {
    return this.collection.updateOne({ _id: guildID }, { $set: values });
  }

  createPunishment(guildID: string, model: PunishmentsSchema) {
    return this.collection.updateOne({
      punishments: {
        $not: { $size: 10 }
      },

      _id: guildID
    }, {
      $push: model
    });
  }

  deletePunishment(guildID: string) {
    // todo: this
  }
}
