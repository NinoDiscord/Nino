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
import CommandService from '../../services/CommandService';
import Permissions from '../../util/Permissions';
import { Inject } from '@augu/lilith';
import Discord from '../../components/Discord';

interface CommandCategories {
  moderation?: Command[];
  settings?: Command[];
  general?: Command[];
}

export default class HelpCommand extends Command {
  private categories!: CommandCategories;
  private parent!: CommandService;

  @Inject
  private discord!: Discord;

  constructor() {
    super({
      description: 'descriptions.help',
      examples: ['help', 'help help', 'help General'],
      cooldown: 2,
      aliases: ['halp', 'h', 'cmds', 'commands'],
      usage: '[cmdOrMod | "usage"]',
      name: 'help'
    });
  }

  run(msg: CommandMessage, [command]: [string]) {
    return command !== undefined ? this.renderDoc(msg, command) : this.renderHelpCommand(msg);
  }

  private async renderHelpCommand(msg: CommandMessage) {
    if (this.categories === undefined) {
      this.categories = {};

      const commands = this.parent.filter(cmd => !cmd.ownerOnly);
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        (this.categories[command.category] ??= []).push(command);
      }
    }

    const prefix = msg.settings.prefixes[Math.floor(Math.random() * msg.settings.prefixes.length)];
    const embed = EmbedBuilder.create()
      .setTitle(msg.locale.translate('commands.help.embed.title', [`${this.discord.client.user.username}#${this.discord.client.user.discriminator}`]))
      .setDescription(msg.locale.translate('commands.help.embed.description', [prefix, this.parent.size]));

    for (const cat in (this.categories as Required<CommandCategories>)) {
      const commands = (this.categories[cat] as Command[]);
      embed.addField(msg.locale.translate(`commands.help.embed.fields.${cat}` as any, [this.categories[cat].length]), commands.map(cmd => `**\`${cmd.name}\`**`).join(', '), false);
    }

    return msg.reply(embed);
  }

  private async renderDoc(msg: CommandMessage, cmdOrMod: string) {
    const command = this.parent.filter(cmd => !cmd.hidden && cmd.name === cmdOrMod || cmd.aliases.includes(cmdOrMod))[0];
    const prefix = msg.settings.prefixes[msg.settings.prefixes.length - 1];

    if (command !== undefined) {
      const description = msg.locale.translate(command.description as any);
      const embed = EmbedBuilder.create()
        .setTitle(msg.locale.translate('commands.help.command.embed.title', [command.name]))
        .setDescription(msg.locale.translate('commands.help.command.embed.description', [description]))
        .addFields(
          [
            {
              name: msg.locale.translate('commands.help.command.embed.fields.syntax'),
              value: `**\`${prefix}${command.format}\`**`,
              inline: false
            },
            {
              name: msg.locale.translate('commands.help.command.embed.fields.category'),
              value: firstUpper(command.category),
              inline: true
            },
            {
              name: msg.locale.translate('commands.help.command.embed.fields.aliases'),
              value: command.aliases.join(', ') || 'No aliases available',
              inline: true
            },
            {
              name: msg.locale.translate('commands.help.command.embed.fields.owner_only'),
              value: command.ownerOnly ? 'Yes' : 'No',
              inline: true
            },
            {
              name: msg.locale.translate('commands.help.command.embed.fields.cooldown'),
              value: `${command.cooldown} Seconds`,
              inline: true
            },
            {
              name: msg.locale.translate('commands.help.command.embed.fields.user_perms'),
              value: Permissions.stringify(command.userPermissions.reduce((acc, curr) => acc | ErisConstants.Permissions[curr], 0n)) || 'None',
              inline: true
            },
            {
              name: msg.locale.translate('commands.help.command.embed.fields.bot_perms'),
              value: Permissions.stringify(command.botPermissions.reduce((acc, curr) => acc | ErisConstants.Permissions[curr], 0n)) || 'None',
              inline: true
            },
            {
              name: msg.locale.translate('commands.help.command.embed.fields.examples'),
              value: command.examples.map(example => `• **${prefix}${example}**`).join('\n') || 'No examples are available.',
              inline: false
            }
          ]
        );

      return msg.reply(embed);
    } else {
      if (cmdOrMod === 'usage') {
        const embed = EmbedBuilder.create()
          .setTitle(msg.locale.translate('commands.help.usage_title'))
          .setDescription(msg.locale.translate('commands.help.usage', [msg.settings.prefixes[0]]));

        return msg.reply(embed);
      }

      const mod = this.parent.filter(cmd => cmd.category.toLowerCase() === cmdOrMod.toLowerCase());
      if (mod.length > 0) {
        const embed = EmbedBuilder.create()
          .setAuthor(msg.locale.translate('commands.help.module.embed.title', [firstUpper(cmdOrMod)]))
          .setDescription(mod.map(command =>
            `**\`${prefix}${command.format}\`** ~  \u200b \u200b**${msg.locale.translate(command.description as any)}**`
          ));

        return msg.reply(embed);
      } else {
        return msg.reply(msg.locale.translate('commands.help.command.not_found', [cmdOrMod]));
      }
    }
  }
}
