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

import { Command, CommandMessage, Subcommand } from '../../structures';
import type { TextChannel } from 'eris';
import { Categories } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Discord from '../../components/Discord';

export default class ModLogCommand extends Command {
  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  constructor() {
    super({
      userPermissions: ['manageGuild'],
      description: 'descriptions.logging',
      category: Categories.Settings,
      examples: [
        'logging | Enable / Disable the feature',
        'logging reset | Reset the mod log channel',
        'logging events | Enable all logging events',
        'logging event message.update | Enable a specific event',
        'logging <#236987412589632587> | Specify a logs channel',
        'logging ignore <#5246968653214587563> | Ignores a channel from displaying logs',
        'logging ignore <@1532589645236985346> | Ignores a specific user from being displayed in logs'
      ],
      aliases: ['logs'],
      usage: '[channelID]',
      name: 'logging'
    });
  }

  async run(msg: CommandMessage, [channel]: [string]) {
    if (!channel) {
      const checkmark = msg.guild.emojis.find(emoji => emoji.id === '464708611260678145') !== undefined ? '<:success:464708611260678145>' : ':white_check_mark:';
      const xmark = msg.guild.emojis.find(emoji => emoji.id === '464708589123141634') !== undefined ? '<:xmark:464708589123141634>' : ':x:';
      const settings = await this.database.logging.get(msg.guild.id);
      const type = !settings.enabled;

      const result = await this.database.logging.update(msg.guild.id, {
        enabled: type
      });

      return msg.reply(result.affected === 1 ? checkmark : xmark);
    }

    const chan = await this.discord.getChannel<TextChannel>(channel, msg.guild);
    if (chan === null)
      return msg.reply(`Channel "${channel}" doesn't exist.`);

    if (chan.type !== 0)
      return msg.reply(`Channel #${chan.name} was not a text channel`);

    const perms = chan.permissionsOf(this.discord.client.user.id);
    if (!perms.has('sendMessages') || !perms.has('readMessages') || !perms.has('embedLinks'))
      return msg.reply(`I am missing the following permissions: **Send Messages**, **Read Messages**, and **Embed Links** in #${chan.name}.`);

    await this.database.logging.update(msg.guild.id, {
      channelID: chan.id
    });

    return msg.reply(`Logs will be shown in #${chan.name}!`);
  }

  @Subcommand()
  async reset(msg: CommandMessage) {
    const settings = await this.database.logging.get(msg.guild.id);
    if (!settings.channelID)
      return msg.reply('No mod logs channel has been set.');

    await this.database.logging.update(msg.guild.id, {
      channelID: undefined
    });

    return msg.reply('Resetted the mod log successfully.');
  }

  @Subcommand('<event>')
  async event(msg: CommandMessage, [event]: string) {
    // todo: this
  }
}
