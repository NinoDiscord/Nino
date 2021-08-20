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

import { Command, CommandMessage } from '../../structures';
import { Categories } from '../../util/Constants';
import { Stopwatch } from '@augu/utils';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';

export default class ResetCommand extends Command {
  @Inject
  private readonly database!: Database;

  constructor() {
    super({
      userPermissions: 'manageGuild',
      description: 'descriptions.reset',
      category: Categories.Settings,
      name: 'reset',
    });
  }

  async run(msg: CommandMessage) {
    const response = await msg.awaitReply(
      [
        'Do you wish to reset all guild settings? __Y__es or __No__?',
        'If you wish to reset them, you will not be able to replace them back.',
      ].join('\n'),
      60,
      (m) => m.author.id === msg.author.id && ['y', 'yes', 'n', 'no'].includes(m.content)
    );

    if (['yes', 'y'].includes(response.content)) {
      const message = await msg.reply('Deleting guild settings...');
      const stopwatch = new Stopwatch();
      stopwatch.start();

      await Promise.all([
        this.database.guilds.update(msg.guild.id, {
          mutedRoleID: undefined,
          modlogChannelID: undefined,
        }),

        this.database.logging.update(msg.guild.id, {
          enabled: false,
          events: [],
          channelID: undefined,
          ignoreChannels: [],
          ignoreUsers: [],
        }),

        this.database.automod.update(msg.guild.id, {
          blacklistWords: [],
          shortLinks: false,
          blacklist: false,
          mentions: false,
          invites: false,
          dehoist: false,
          spam: false,
          raid: false,
        }),
      ]);

      const endTime = stopwatch.end();
      await message.delete();

      return msg.success(`Resetted guild settings in ~**${endTime}**`);
    }

    return msg.reply('Will not reset guild settings on command.');
  }
}
