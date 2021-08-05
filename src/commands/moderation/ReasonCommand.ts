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
import PunishmentService from '../../services/PunishmentService';
import type CaseEntity from '../../entities/CaseEntity';
import { Categories } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import ms from 'ms';

export default class ReasonCommand extends Command {
  @Inject
  private readonly punishments!: PunishmentService;

  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  constructor() {
    super({
      userPermissions: 'kickMembers',
      botPermissions: 'manageMessages',
      description: 'descriptions.reason',
      category: Categories.Moderation,
      examples: [
        'reason 69 some reason!',
        'reason latest another reason',
        'reason l another reason that is the recent case',
      ],
      usage: '[caseID | "l" | "latest"] [...reason]',
      aliases: ['set-reason', 'r'],
      name: 'reason',
    });
  }

  async run(msg: CommandMessage, [caseID, ...reason]: [string, ...string[]]) {
    if (!caseID) return msg.reply('Missing case ID.');

    const id = Number(caseID);
    if (isNaN(id)) return msg.reply('Case ID was not a number.');

    let caseModel = await this.database.cases.get(msg.guild.id, id);
    if (!caseModel) return msg.reply(`Case with ID #**${id}** was not found.`);

    if (reason.includes(' | ') && ms(reason.join(' ').split(' | ')[1]) !== undefined)
      await msg.reply(
        'Due to infrastructure issues with some internal stuff, editing times will be deprecated & removed in a future release.'
      );

    await this.database.cases.update(msg.guild.id, caseModel.index, {
      reason: reason.join(' ') || 'No reason was provided.',
    });

    caseModel = (await this.database.cases.get(msg.guild.id, id)) as unknown as CaseEntity;
    if (caseModel.messageID !== null && msg.settings.modlogChannelID !== null) {
      const channel = await this.discord.getChannel<TextChannel>(msg.settings.modlogChannelID!);

      if (channel === null)
        return msg.reply(
          'unknown error occured, report to devs here under <#824071651486335036>: https://discord.gg/ATmjFH9kMH'
        );

      const message = await this.discord.client.getMessage(channel!.id, caseModel.messageID!);
      await this.punishments.editModLog(caseModel, message);

      return msg.reply(`Updated case #**${caseModel.index}** with reason **${reason.join(' ') || '(unknown)'}**`);
    }

    return msg.reply(
      "Unable to edit case due to no mod-log channel or that case didn't create a message in the mod-log."
    );
  }

  @Subcommand('<...reason>', ['l'])
  async latest(msg: CommandMessage, reason: string[]) {
    const latestCases = await this.database.cases.getAll(msg.guild.id);
    if (!latestCases.length) return msg.reply('There are no recent cases to edit, maybe punish someone?');

    if (reason.includes(' | ') && ms(reason.join(' ').split(' | ')[1]) !== undefined)
      await msg.reply(
        'Due to infrastructure issues with some internal stuff, editing times will be deprecated & removed in a future release.'
      );

    let latestCaseModel = latestCases[latestCases.length - 1]; // .last(); when :woeme:
    await this.database.cases.update(msg.guild.id, latestCaseModel.index, {
      reason: reason.join(' ') || 'No reason was provided.',
    });

    latestCaseModel = await this.database.cases.get(msg.guild.id, latestCaseModel.index).then((r) => r!);
    if (latestCaseModel.messageID !== null && msg.settings.modlogChannelID !== null) {
      const channel = await this.discord.getChannel<TextChannel>(msg.settings.modlogChannelID!);

      if (channel === null)
        return msg.reply(
          'unknown error occured, report to devs here under <#824071651486335036>: https://discord.gg/ATmjFH9kMH'
        );

      const message = await this.discord.client.getMessage(channel!.id, latestCaseModel.messageID!);
      await this.punishments.editModLog(latestCaseModel, message);

      return msg.reply(`Updated case #**${latestCaseModel.index}** with reason **${reason.join(' ') || '(unknown)'}**`);
    }

    return msg.reply(
      "Unable to edit case due to no mod-log channel or that case didn't create a message in the mod-log."
    );
  }
}
