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

import { Command, CommandMessage, EmbedBuilder } from '../../structures';
import PunishmentService from '../../services/PunishmentService';
import { Categories } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import ms from 'ms';

export default class CaseCommand extends Command {
  @Inject
  private punishments!: PunishmentService;

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  constructor() {
    super({
      userPermissions: 'banMembers',
      description: 'descriptions.case',
      examples: [
        'case',
        'case 3'
      ],
      category: Categories.Moderation,
      aliases: ['lookup'],
      usage: '[caseID]',
      name: 'case'
    });
  }

  async run(msg: CommandMessage, args: string[]) {
    if (args.length < 1)
      return msg.reply('No bot or user was found.');

    const caseID = args[0];
    if (isNaN(Number(caseID)))
      return msg.reply(`Case \`${caseID}\` was not a number.`);

    const caseModel = await this.database.cases.repository.findOne({
      guildID: msg.guild.id,
      index: Number(caseID)
    });

    if (caseModel === undefined)
      return msg.reply(`Case #**${caseID}** was not found.`);

    const moderator = this.discord.client.users.get(caseModel.moderatorID) ?? {
      username: 'Unknown User',
      discriminator: '0000'
    };

    const victim = this.discord.client.users.get(caseModel.victimID) ?? {
      discriminator: '0000',
      username: 'Unknown User'
    };

    const embed = EmbedBuilder.create()
      .setAuthor(`[ Case #${caseModel.index} | ${victim.username}#${victim.discriminator} (${caseModel.victimID})]`, undefined, victim.dynamicAvatarURL?.('png', 1024)) // dynamicAvatarURL might not exist since partials
      .setDescription([
        `${caseModel.reason ? `**${caseModel.reason}**` : `*Unknown, use \`${msg.settings.prefixes[0]}reason ${caseModel.index} <reason>\` to set a reason*`}`,
        '',
        caseModel.messageID !== null ? `[**\`[Jump Here]\`**](https://discord.com/channels/${msg.guild.id}/${msg.settings.modlogChannelID}/${caseModel.messageID})` : ''
      ])
      .addField('• Moderator', `${moderator.username}#${moderator.discriminator} (${moderator.id})`, true)
      .addField('• Type', caseModel.type, true);

    if (caseModel.time !== null)
      embed.addField('• Time', ms(caseModel.time!, { long: true }), true);

    return msg.reply(embed);
  }
}
