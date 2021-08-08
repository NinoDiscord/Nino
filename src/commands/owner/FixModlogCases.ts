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

import { Inject } from '@augu/lilith';
import { Stopwatch } from '@augu/utils';
import { TextChannel } from 'eris';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import CaseEntity from '../../entities/CaseEntity';
import PunishmentService from '../../services/PunishmentService';
import { Command, CommandMessage } from '../../structures';
import { withIndex } from '../../util';
import { Categories } from '../../util/Constants';

export default class FixModlogCasesCommand extends Command {
  @Inject
  private readonly punishments!: PunishmentService;

  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  constructor() {
    super({
      description: 'Fixes all mod-log entries that repeat the same entry index.',
      category: Categories.Owner,
      ownerOnly: true,
      hidden: true,
      usage: '<index>',
      name: 'fix-modlog',
    });
  }

  async run(msg: CommandMessage, [index]: [string]) {
    if (!index) return msg.reply("Cannot fix mod-log cases that don't have an index.");

    if (Number.isNaN(index)) return msg.reply('The index must be a number.');

    const cases = await this.database.cases['repository'].find({
      index: Number(index),
    });

    if (!cases.length) return msg.reply(`No cases were found with index **${index}**`);

    if (cases.length === 1) return msg.reply(`Cannot fix case with 1 entry (**${index}**)`);

    const message = await msg.reply(`:pencil2: **Fixing ${cases.length} cases...**`);
    const stopwatch = new Stopwatch();
    stopwatch.start();

    const modlog = await this.discord.getChannel<TextChannel>(msg.settings.modlogChannelID!);
    const casesByMessage = await Promise.all(
      cases.filter((s) => s.messageID === undefined).map((s) => modlog!.getMessage(s.messageID!))
    );
    const ascending = casesByMessage.sort((a, b) => a.createdAt - b.createdAt);

    let success = 0;
    for (const [idx, message] of withIndex(ascending)) {
      const id = idx + 1;
      const i = Number(index) + id;

      const builder = await this.database.connection
        .createQueryBuilder()
        .update(CaseEntity)
        .set({
          index: i,
        })
        .where('guild_id = :id', { id: msg.guild.id })
        .andWhere('index = :idx', { idx: Number(index) })
        .andWhere('message_id = :mid', { mid: message.id })
        .execute();

      if (builder.affected !== undefined && builder.affected === 1) success++;

      const entry = await this.database.cases.get(msg.guild.id, i);
      if (entry !== undefined) {
        await this.punishments.editModLog(entry, message);
      }
    }

    await message.delete();
    const endTime = stopwatch.end();

    return msg.success(`Took **${endTime}** to update ${success} / ${ascending.length} cases.`);
  }
}
