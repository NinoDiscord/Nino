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
import LocalizationService from '../../services/LocalizationService';
import { Inject } from '@augu/lilith';
import { Color } from '../../util/Constants';
import Database from '../../components/Database';
import Discord from '../../components/Discord';

interface Flags {
  user?: string | true;
  u?: string | true;
}

export default class LocaleCommand extends Command {
  @Inject
  private languages!: LocalizationService;

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  constructor() {
    super({
      description: 'descriptions.locale',
      examples: [
        'locale',
        'locale list',
        'locale set fr_FR --user',
        'locale set fr_FR',
        'locale reset --user',
        'locale reset'
      ],
      aliases: ['language', 'lang'],
      name: 'locale'
    });
  }

  run(msg: CommandMessage) {
    const embed = new EmbedBuilder()
      .setTitle('[ Localization ]')
      .setColor(Color)
      .setDescription([
        '> **Current Settings**',
        '```apache',
        `Guild: ${msg.settings.language}`,
        `User:  ${msg.userSettings.language}`,
        '```',
        '',
        `• Use \`${msg.settings.prefixes[0]}locale set fr_FR\` to set the guild's language (Requires \`Manage Guild\`)`,
        '• Use the \`--user\` or \`-u\` flag to set or reset your language.',
        `• Use \`${msg.settings.prefixes[0]}locale list\` to view a list of the languages available`
      ]);

    return msg.reply(embed);
  }

  @Subcommand()
  list(msg: CommandMessage) {
    const languages = this.languages.locales.map(locale => {
      const user = this.discord.client.users.get(locale.translator);
      return `❯ ${locale.flag} **${locale.full} (${locale.code})** by **${user?.username ?? 'Unknown User'}**#**${user?.discriminator ?? '0000'}** (${locale.contributors.length} contributers, \`${msg.settings.prefixes[0]}locale set ${locale.code} -u\`)`;
    });

    return msg.reply(
      new EmbedBuilder()
        .setColor(Color)
        .setTitle('[ Languages ]')
        .setDescription(languages)
    );
  }

  @Subcommand('<locale>')
  async set(msg: CommandMessage, [locale]: [string]) {
    if (!locale)
      return msg.reply(`No locale has been specified, use \`${msg.settings.prefixes[0]}locale list\` to list all of them`);

    if (!this.languages.locales.has(locale))
      return msg.reply(`Locale \`${locale}\` doesn't exist, use \`${msg.settings.prefixes[0]}locale list\` to list all of them`);

    const flags = msg.flags<Flags>();
    const isUser = flags.user === true || flags.u === true;
    const controller = isUser ? this.database.users : this.database.guilds;
    const id = isUser ? msg.author.id : msg.guild.id;

    await controller.update(id, { language: locale });
    return msg.reply(`Language for ${isUser ? 'user' : 'server'} has been set to **${locale}**`);
  }

  @Subcommand()
  async reset(msg: CommandMessage) {
    const flags = msg.flags<Flags>();
    const isUser = flags.user === true || flags.u === true;
    const controller = isUser ? this.database.users : this.database.guilds;
    const id = isUser ? msg.author.id : msg.guild.id;

    await controller.update(id, { language: this.languages.defaultLocale.code });
    return msg.reply(`Language for ${isUser ? 'user' : 'server'} has been resetted to **${this.languages.defaultLocale.code}**`);
  }
}
