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
import { Constants as ErisConstants } from 'eris';
import { firstUpper } from '@augu/utils';
import * as Constants from '../../util/Constants';
import CommandService from '../../services/CommandService';
import Permissions from '../../util/Permissions';
import { Inject } from '@augu/lilith';

interface CommandCategories {
  moderation?: Command[];
  settings?: Command[];
  general?: Command[];
}

export default class HelpCommand extends Command {
  private categories!: CommandCategories;

  @Inject
  private service!: CommandService;

  constructor() {
    super({
      description: 'descriptions.help',
      examples: ['help', 'help help', 'help General'],
      cooldown: 2,
      aliases: ['halp', 'h', 'cmds', 'commands'],
      name: 'help'
    });
  }

  run(msg: CommandMessage, [command]: [string]) {
    if (!command)
      return this.renderHelpCommand(msg);
    else
      return this.renderDoc(msg, command);
  }

  private _calculateLength(a: Command) {
    return a.name.length;
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

    const prefix = msg.settings.prefixes[msg.settings.prefixes.length - 1];
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

  private async renderDoc(msg: CommandMessage, cmdOrMod: string) {
    const command = this.service.commands.filter(cmd => !cmd.hidden && cmd.name === cmdOrMod || cmd.aliases.includes(cmdOrMod))[0];
    const prefix = msg.settings.prefixes[msg.settings.prefixes.length - 1];

    if (command !== undefined) {
      const embed = new EmbedBuilder()
        .setColor(Constants.Color)
        .setTitle(`[ :pencil2: Command ${command.name} ]`)
        .setDescription(`> **${command.description}**`)
        .addFields(
          [
            {
              name: '• Syntax',
              value: `${prefix}${command.format}`,
              inline: false
            },
            {
              name: '• Category',
              value: firstUpper(command.category),
              inline: true
            },
            {
              name: '• Aliases',
              value: command.aliases.join(', ') || 'No aliases available',
              inline: true
            },
            {
              name: '• Owner Only',
              value: command.ownerOnly ? 'Yes' : 'No',
              inline: true
            },
            {
              name: '• Cooldown',
              value: `${command.cooldown} Seconds`,
              inline: true
            },
            {
              name: '• User Permissions',
              value: Permissions.stringify(command.userPermissions.reduce((acc, curr) => acc | ErisConstants.Permissions[curr], 0)) || 'None',
              inline: true
            },
            {
              name: '• Bot Permissions',
              value: Permissions.stringify(command.botPermissions.reduce((acc, curr) => acc | ErisConstants.Permissions[curr], 0)) || 'None',
              inline: true
            },
            {
              name: '• Examples',
              value: command.examples.map(example => `• **${prefix}${example}**`).join('\n') || 'No examples are available.',
              inline: false
            }
          ]
        );

      return msg.reply(embed);
    } else {
      const mod = this.service.commands.filter(cmd => cmd.category.toLowerCase() === cmdOrMod.toLowerCase());
      if (mod.length > 0) {
        const longestName = this._calculateLength(mod.sort((a, b) => this._calculateLength(b) - this._calculateLength(a))[0]);
        const embed = new EmbedBuilder()
          .setColor(Constants.Color)
          .setAuthor(`[ Module ${firstUpper(cmdOrMod)} ]`)
          .setDescription(mod.map(command =>
            `**\`${prefix}${command.name.padEnd((longestName * 2), ' \u200b')}\`** ~  \u200b \u200b${command.description}`
          ));

        return msg.reply(embed);
      } else {
        return msg.reply(`:x: Command or module **${cmdOrMod}** was not found.`);
      }
    }
  }
}
