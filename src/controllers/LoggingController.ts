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

import LoggingEntity, { LoggingEvents } from '../entities/LoggingEntity';
import type Database from '../components/Database';

export default class LoggingController {
  constructor(private database: Database) {}

  private get repository() {
    return this.database.connection.getRepository(LoggingEntity);
  }

  get(guildID: string) {
    return this.repository.findOne({ guildID });
  }

  create(guildID: string) {
    const entry = new LoggingEntity();
    entry.ignoreChannels = [];
    entry.ignoreUsers = [];
    entry.enabled = false;
    entry.events = [];
    entry.guildID = guildID;

    return this.repository.save(entry);
  }

  async addIgnoreChannel(guildID: string, channelID: string) {
    const entry = await this.get(guildID);
    entry?.ignoreChannels.push(channelID);

    if (entry !== undefined)
      await this.repository.save(entry);
  }

  async removeIgnoreChannel(guildID: string, channelID: string) {
    const entry = await this.get(guildID);
    if (entry === undefined)
      throw new TypeError(); // shouldn't reach here but HEY, you never know

    const index = entry.ignoreChannels.findIndex(id => id === channelID);
    if (index === -1)
      throw new RangeError(`channel "${channelID}" was not found`); // we can reach this, so yes

    entry.ignoreChannels.splice(index, 1);
    await this.repository.save(entry);
  }

  async addIgnoredUser(guildID: string, userID: string) {
    const entry = await this.get(guildID);
    entry?.ignoreUsers.push(userID);

    if (entry !== undefined)
      await this.repository.save(entry);
  }

  async removeIgnoredUser(guildID: string, userID: string) {
    const entry = await this.get(guildID);
    if (entry === undefined)
      throw new TypeError(); // shouldn't reach here but HEY, you never know

    const index = entry.ignoreUsers.findIndex(id => id === userID);
    if (index === -1)
      throw new RangeError(`user "${userID}" was not found`); // we can reach this, so yes

    entry.ignoreUsers.splice(index, 1);
    await this.repository.save(entry);
  }
}

/*
  @Column({ default: '{}', array: true, type: 'text' })
  public ignoreUsers!: string[];

  @Column({ name: 'channel_id', nullable: true })
  public channelID?: string;

  @Column({ default: false })
  public enabled!: boolean;

  @Column({ type: 'enum', array: true, enum: LoggingEvents, default: '{}' })
  public events!: LoggingEvents[];

  @PrimaryColumn({ name: 'guild_id' })
  public guildID!: string;
*/
