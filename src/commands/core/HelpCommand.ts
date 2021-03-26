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
import { firstUpper } from '@augu/utils';
import * as Constants from '../../util/Constants';
import CommandService from '../../services/CommandService';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';

interface HelpCommandArgs {
  cmdOrMod?: string;
}

interface CommandCategories {
  moderation?: Command[];
  settings?: Command[];
  general?: Command[];
}

export default class HelpCommand extends Command {
  private categories!: CommandCategories;

  @Inject
  private database!: Database;

  @Inject
  private service!: CommandService;

  constructor() {
    super({
      description: 'descriptions.help',
      cooldown: 2,
      aliases: ['halp', 'h', 'cmds', 'commands'],
      name: 'help',
      args: [
        {
          name: 'cmdOrMod',
          type: 'string',
          optional: true
        }
      ]
    });
  }

  run(msg: CommandMessage, args: HelpCommandArgs) {
    if (!args.cmdOrMod)
      return this.renderHelpCommand(msg);
    else
      return this.renderDoc(msg, args.cmdOrMod);
  }

  private async renderHelpCommand(msg: CommandMessage) {
    if (this.categories === undefined) {
      this.categories = {};

      const commands = this.service.commands.filter(cmd => !cmd.ownerOnly || !cmd.hidden);
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        (this.categories[command.category] ??= []).push(command);
      }
    }

    const settings = await this.database.guilds.get(msg.guild.id);
    const prefix = settings.prefixes[settings.prefixes.length - 1];

    const embed = new EmbedBuilder()
      .setColor(Constants.Color)
      .setDescription([
        `:pencil2: **For more documentation of a command or module, run \`${prefix}help <cmdOrMod>\` with \`<cmdOrMod>\` with the command or module you want to look up.**`,
        '',
        'You can browse the [website](https://nino.floofy.dev) for more information and a prettier UI for this help command.',
        `There are currently **${this.service.commands.size}** commands available.`
      ]);

    for (const cat in (this.categories as Required<CommandCategories>)) {
      const commands = (this.categories[cat] as Command[]);
      embed.addField(`• ${firstUpper(cat)} [${this.categories[cat].length}]`, commands.map(cmd => `**\`${cmd.name}\`**`).join(', '), false);
    }

    return msg.reply(embed);
  }

  private renderDoc(msg: CommandMessage, cmdOrMod: string) {
    return msg.reply('uwu / owo');
  }
}
