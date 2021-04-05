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
import { Inject, LinkParent } from '@augu/lilith';
import { Categories } from '../../util/Constants';
import CommandService from '../../services/CommandService';
import Database from '../../components/Database';
import Discord from '../../components/Discord';

@LinkParent(CommandService)
export default class ModLogCommand extends Command {
  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  constructor() {
    super({
      userPermissions: ['manageGuild'],
      description: 'descriptions.modlog',
      category: Categories.Settings,
      examples: [
        'modlog',
        'modlog reset',
        'modlog <#236987412589632587>'
      ],
      aliases: ['set-modlog'],
      usage: '[channel]',
      name: 'modlog'
    });
  }

  async run(msg: CommandMessage, [channel]: [string]) {
    if (!channel) {
      const chan = msg.settings.modlogChannelID !== null ? await this.discord.getChannel<TextChannel>(msg.settings.modlogChannelID!, msg.guild) : null;
      return msg.reply(chan === null ? 'No mod-log has been set.' : `Mod Logs are set in **#${chan.name}**`);
    }

    const chan = await this.discord.getChannel<TextChannel>(channel, msg.guild);
    if (chan === null)
      return msg.reply(`Channel "${channel}" doesn't exist.`);

    if (chan.type !== 0)
      return msg.reply(`Channel #${chan.name} was not a text channel`);

    const perms = chan.permissionsOf(this.discord.client.user.id);
    if (!perms.has('sendMessages') || !perms.has('readMessages') || !perms.has('embedLinks'))
      return msg.reply(`I am missing the following permissions: **Send Messages**, **Read Messages**, and **Embed Links** in #${chan.name}.`);

    await this.database.guilds.update(msg.guild.id, {
      modlogChannelID: chan.id
    });

    return msg.reply(`Mod Logs are now set in #${chan.name}!`);
  }

  @Subcommand()
  async reset(msg: CommandMessage) {
    if (!msg.settings.modlogChannelID)
      return msg.reply('No mod logs channel has been set.');

    await this.database.guilds.update(msg.guild.id, {
      modlogChannelID: undefined
    });

    return msg.reply('Resetted the mod log successfully.');
  }
}
