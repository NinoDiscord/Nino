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

import { Inject, Subscribe } from '@augu/lilith';
import type { Guild, Role } from 'eris';
import { Logger } from 'tslog';
import Database from '../components/Database';

export default class GuildRoleListener {
  @Inject
  private readonly database!: Database;

  @Inject
  private readonly logger!: Logger;

  @Subscribe('guildRoleDelete', { emitter: 'discord' })
  async onGuildRoleDelete(guild: Guild, role: Role) {
    const settings = await this.database.guilds.get(guild.id);
    if (!settings.mutedRoleID) return;
    if (role.id !== settings.mutedRoleID) return;

    this.logger.warn(`Muted role ${settings.mutedRoleID} was accidently deleted, so I deleted it in the database. :)`);
    await this.database.guilds.update(guild.id, { mutedRoleID: role.id });
  }
}
