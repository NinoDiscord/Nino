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

import { Command, Subcommand, CommandMessage } from '../../structures';
import { Categories } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Discord from '../../components/Discord';

export default class MutedRoleCommand extends Command {
  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  constructor() {
    super({
      userPermissions: 'manageGuild',
      description: 'descriptions.muted_role',
      category: Categories.Settings,
      examples: [
        'muterole | View the current Muted role in this server',
        'muterole reset | Resets the Muted role in this server',
        'muterole 3621587485965325 | Sets the current mute role',
      ],
      aliases: ['mutedrole', 'mute-role'],
      name: 'muterole',
    });
  }

  async run(msg: CommandMessage, [roleID]: [string]) {
    if (!roleID)
      return msg.settings.mutedRoleID !== null
        ? msg.reply(`The muted role in this guild is <@&${msg.settings.mutedRoleID}>`)
        : msg.reply('No muted role is set in this guild.');

    const role = await this.discord.getRole(roleID, msg.guild);
    if (role === null) return msg.reply(`\`${roleID}\` was not a role.`);

    await this.database.guilds.update(msg.guild.id, { mutedRoleID: role.id });
    return msg.reply(`The Muted role is now set to **${role.name}**`);
  }

  @Subcommand()
  async reset(msg: CommandMessage) {
    await this.database.guilds.update(msg.guild.id, { mutedRoleID: undefined });
    return msg.reply(':thumbsup: Muted role has been reset.');
  }
}
