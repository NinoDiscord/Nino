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

import GuildEntity from '../entities/GuildEntity';
import Database from '../components/Database';

export default class GuildSettingsController {
  constructor(private database: Database) {}

  private get repository() {
    return this.database.connection.getRepository(GuildEntity);
  }

  async get(id: string) {
    const settings = await this.repository.findOne({ guildID: id });
    if (settings === undefined) {
      const entry = new GuildEntity();
      entry.prefixes = [];
      entry.language = 'en_US';
      entry.guildID = id;

      await this.repository.save(entry);
      await this.database.logging.create(id);
      //await this.database.automod.create(id);

      return entry;
    }

    return settings;
  }

  delete(id: string) {
    return this.repository.delete({ guildID: id });
  }

  async setModLogChannel(guildID: string, id: string) {
    const settings = await this.get(guildID);
    settings.modlogChannelID = id;

    return this.repository.save(settings);
  }

  async setMutedRole(guildID: string, id: string) {
    const settings = await this.get(guildID);
    settings.mutedRoleID = id;

    return this.repository.save(settings);
  }

  async addPrefix(guildID: string, prefix: string) {
    const settings = await this.get(guildID);
    settings.prefixes.push(prefix);

    return this.repository.save(settings);
  }

  async removePrefix(guildID: string, prefix: string) {
    const settings = await this.get(guildID);
    const index = settings.prefixes.findIndex(val => val.toLowerCase() === prefix.toLowerCase());
    settings.prefixes.splice(index, 1);

    return this.repository.save(settings);
  }

  async setLocale(guildID: string, locale: string) {
    const settings = await this.get(guildID);
    settings.language = locale;

    return this.repository.save(settings);
  }
}
