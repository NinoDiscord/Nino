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
import Database from '../components/Database';

export const enum PunishmentType {
  WarningRemoved = 'warning.removed',
  VoiceUndeafen  = 'voice.undeafen',
  WarningAdded   = 'warning.added',
  VoiceUnmute    = 'voice.unmute',
  VoiceDeafen    = 'voice.deafen',
  VoiceMute      = 'voice.mute',
  Unmute         = 'unmute',
  Unban          = 'unban',
  Kick           = 'kick',
  Mute           = 'mute',
  Ban            = 'ban'
}

export interface ICaseSchema {
  warningsRemoved?: number;
  warningsAdded?: number;
  moderatorID: string;
  messageID: string | null;
  userID: string;
  index: number;
  time?: number;
  type: PunishmentType;
  soft: boolean;
  _id: string;
}

export default class CasesSchema {
  private readonly collection: Collection<ICaseSchema>;
  constructor(database: Database) {
    this.collection = database.db.collection('cases');
  }

  get(guildID: string, index: number) {
    return this.collection.findOne({ _id: guildID, index });
  }

  getAll(guildID: string) {
    return this.collection.find({ _id: guildID }).toArray();
  }

  getAllByUser(guildID: string, userID: string) {
    return this.collection.find({ userID, _id: guildID }).toArray();
  }

  delete(guildID: string, index: number) {
    return this.collection.deleteOne({ _id: guildID, index });
  }

  update(guildID: string, index: number, values: {
    [P in keyof Omit<ICaseSchema, 'moderatorID' | '_id' | 'userID' | 'type'>]?: ICaseSchema[P];
  }) {
    return this.collection.updateOne({ _id: guildID, index }, { $set: values });
  }

  async create(guildID: string, type: PunishmentType, model: {
    [P in keyof Omit<ICaseSchema, 'type' | 'messageID' | 'index' | '_id'>]: ICaseSchema[P];
  }) {
    const newest = await this.collection.find({ guildID }).sort('-index').toArray();
    return this.collection.insertOne({
      moderatorID: model.moderatorID,
      messageID: null,
      userID: model.userID,
      index: newest[0] !== undefined ? newest[0].index + 1 : 1,
      time: model.time,
      type,
      soft: model.soft,
      _id: guildID
    });
  }
}
