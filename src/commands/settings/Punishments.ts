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

import { Command, CommandMessage, EmbedBuilder, Subcommand } from '../../structures';
import { PunishmentType } from '../../entities/PunishmentsEntity';
import { Categories } from '../../util/Constants';
import { firstUpper } from '@augu/utils';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import ms = require('ms');

// Punishments shouldn't be chained with warnings and voice-related shit
const TYPES = Object.values(PunishmentType).filter((w) => !w.startsWith('warning.') && !w.startsWith('voice.'));

interface Flags {
  soft?: string | true;
  days?: string | true;
  d?: string | true;
  s?: string | true;
}

export default class PunishmentsCommand extends Command {
  @Inject
  private database!: Database;

  constructor() {
    super({
      userPermissions: 'manageGuild',
      description: 'descriptions.punishments',
      category: Categories.Settings,
      examples: [
        'punishments | List all the punishments in this guild',
        'punishments 3 mute | Add a punishment of 3 warnings to be a mute',
        'punishments 5 ban / 1d | Adds a punishment for a ban for a day',
        'punishments remove 3 | Remove a punishment by the index',
      ],
      aliases: ['punish'],
      name: 'punishments',
    });
  }

  async run(msg: CommandMessage, [index, type, time]: [string, string, string?]) {
    const punishments = await this.database.punishments.getAll(msg.guild.id);

    if (!index) {
      if (!punishments.length) return msg.reply('There are no punishments setup in this guild.');

      const embed = EmbedBuilder.create()
        .setTitle(`:pencil2: ~ Punishments for ${msg.guild.name}`)
        .addFields(
          punishments.map((punishment) => ({
            name: `❯ Punishment #${punishment.index}`,
            value: [
              `• **Warnings**: ${punishment.warnings}`,
              `• **Soft**: ${punishment.soft ? 'Yes' : 'No'}`,
              `• **Time**: ${punishment.time !== null ? ms(punishment.time!) : 'No time duration'}`,
              `• **Type**: ${firstUpper(punishment.type)}`,
            ].join('\n'),
            inline: true,
          }))
        );

      return msg.reply(embed);
    }

    if (punishments.length > 10) return msg.reply("Yea, I think you're fine with 10 punishments...");

    if (isNaN(Number(index))) return msg.reply('The amount of warnings you specified was not a number');

    if (Number(index) === 0)
      return msg.reply("You need to specify an amount of warnings, `0` isn't gonna cut it you know.");

    if (Number(index) > 10) return msg.reply('Uh-oh! The guild has reached the maximum amount of 10 warnings, sorry.');

    if (type === undefined || !TYPES.includes(type as any))
      return msg.reply(
        `You haven't specified a punishment type or the one you provided is not a valid one.\n\n\`\`\`apache\n${TYPES.map(
          (type) => `- ${type}`
        ).join('\n')}\`\`\``
      );

    const flags = msg.flags<Flags>();
    const soft = flags.soft === true || flags.s === true;
    const days = flags.days !== undefined ? flags.days : flags.d !== undefined ? flags.d : undefined;
    let timeStamp: number | undefined = undefined;

    try {
      if (time !== undefined) timeStamp = ms(time);
    } catch {
      // uwu
    }

    if (type !== PunishmentType.Ban && soft === true)
      return msg.reply(`The \`--soft\` argument only works on bans only, you specified \`${type}\`.`);

    const entry = await this.database.punishments.create({
      warnings: Number(index),
      guildID: msg.guild.id,
      time: timeStamp,
      soft,
      days: days ? Number(days) : undefined,
      type: type as PunishmentType,
    });

    return msg.reply(`Punishment #**${entry.index}** has been created`);
  }

  @Subcommand('<index>')
  async remove(msg: CommandMessage, [index]: [string]) {
    if (!index)
      return msg.reply(
        `Missing an amount of warnings to be removed. Run \`${msg.settings.prefixes[0]}punishments\` to see which one you want removed.`
      );

    if (isNaN(Number(index))) return msg.reply(`\`${index}\` was not a number`);

    const punishment = await this.database.punishments.get(msg.guild.id, Number(index));
    if (punishment === undefined)
      return msg.reply(
        `Punishment #**${index}** warnings was not found. Run \`${msg.settings.prefixes[0]}punishments\` to see which one you want removed.`
      );

    await this.database.punishments['repository'].delete({
      guildID: msg.guild.id,
      index: Number(index),
    });
    return msg.reply(`:thumbsup: Punishment #**${punishment.index}** has been removed.`);
  }
}
