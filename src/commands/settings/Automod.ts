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

import { Command, CommandMessage, Subcommand, EmbedBuilder } from '../../structures';
import { Inject, LinkParent } from '@augu/lilith';
import { Categories, Color } from '../../util/Constants';
import CommandService from '../../services/CommandService';
import Database from '../../components/Database';

@LinkParent(CommandService)
export default class AutomodCommand extends Command {
  @Inject
  private database!: Database;

  constructor() {
    super({
      userPermissions: 'manageGuild',
      description: 'descriptions.automod',
      category: Categories.Settings,
      examples: [
        'automod',
        'automod spam',
        'automod blacklist uwu owo'
      ],
      name: 'automod'
    });
  }

  async run(msg: CommandMessage) {
    const checkmark = msg.guild.emojis.find(emoji => emoji.id === '464708611260678145') !== undefined ? '<:success:464708611260678145>' : ':white_check_mark:';
    const xmark = msg.guild.emojis.find(emoji => emoji.id === '464708589123141634') !== undefined ? '<:xmark:464708589123141634>' : ':x:';

    const settings = await this.database.automod.get(msg.guild.id);
    const embed = new EmbedBuilder()
      .setColor(Color)
      .setDescription([
        `• ${settings!.blacklist ? checkmark : xmark} **Blacklist Words** (\`${msg.settings.prefixes[0]}automod blacklist\`)`,
        `• ${settings!.mentions ? checkmark : xmark} **Mentions** (\`${msg.settings.prefixes[0]}automod mentions\`)`,
        `• ${settings!.dehoist ? checkmark : xmark} **Dehoisting** (\`${msg.settings.prefixes[0]}automod dehoist\`)`,
        `• ${settings!.invites ? checkmark : xmark} **Invites** (\`${msg.settings.prefixes[0]}automod invites\`)`,
        `• ${settings!.raid ? checkmark : xmark} **Raids** (\`${msg.settings.prefixes[0]}automod raid\`)`,
        `• ${settings!.spam ? checkmark : xmark} **Spam** (\`${msg.settings.prefixes[0]}automod spam\`)`
      ]);

    return msg.reply(embed);
  }

  @Subcommand('[...words]')
  async blacklist(msg: CommandMessage, [...words]: [...string[]]) {
    const checkmark = msg.guild.emojis.find(emoji => emoji.id === '464708611260678145') !== undefined ? '<:success:464708611260678145>' : ':white_check_mark:';
    const xmark = msg.guild.emojis.find(emoji => emoji.id === '464708589123141634') !== undefined ? '<:xmark:464708589123141634>' : ':x:';
    const settings = await this.database.automod.get(msg.guild.id);

    if (!words.length) {
      const type = !settings!.blacklist;

      await this.database.automod.update(msg.guild.id, { blacklist: type });
      return msg.reply(`${type ? checkmark : xmark} Successfully **${type ? 'enabled' : 'disabled'}** the Blacklist automod feature.`);
    }

    const curr = settings!.blacklistWords.concat(words);
    const result = await this.database.automod.update(msg.guild.id, {
      blacklistWords: curr
    });

    return msg.reply(result.affected === 1 ? checkmark : xmark);
  }

  @Subcommand()
  async mentions(msg: CommandMessage) {
    const checkmark = msg.guild.emojis.find(emoji => emoji.id === '464708611260678145') !== undefined ? '<:success:464708611260678145>' : ':white_check_mark:';
    const xmark = msg.guild.emojis.find(emoji => emoji.id === '464708589123141634') !== undefined ? '<:xmark:464708589123141634>' : ':x:';
    const settings = await this.database.automod.get(msg.guild.id);
    const result = await this.database.automod.update(msg.guild.id, {
      mentions: !settings!.mentions
    });

    return msg.reply(result.affected === 1 ? checkmark : xmark);
  }

  @Subcommand()
  async invites(msg: CommandMessage) {
    const checkmark = msg.guild.emojis.find(emoji => emoji.id === '464708611260678145') !== undefined ? '<:success:464708611260678145>' : ':white_check_mark:';
    const xmark = msg.guild.emojis.find(emoji => emoji.id === '464708589123141634') !== undefined ? '<:xmark:464708589123141634>' : ':x:';
    const settings = await this.database.automod.get(msg.guild.id);
    const result = await this.database.automod.update(msg.guild.id, {
      invites: !settings!.invites
    });

    return msg.reply(result.affected === 1 ? checkmark : xmark);
  }

  @Subcommand()
  async dehoist(msg: CommandMessage) {
    const checkmark = msg.guild.emojis.find(emoji => emoji.id === '464708611260678145') !== undefined ? '<:success:464708611260678145>' : ':white_check_mark:';
    const xmark = msg.guild.emojis.find(emoji => emoji.id === '464708589123141634') !== undefined ? '<:xmark:464708589123141634>' : ':x:';
    const settings = await this.database.automod.get(msg.guild.id);
    const result = await this.database.automod.update(msg.guild.id, {
      dehoist: !settings!.dehoist
    });

    return msg.reply(result.affected === 1 ? checkmark : xmark);
  }

  @Subcommand()
  async spam(msg: CommandMessage) {
    const checkmark = msg.guild.emojis.find(emoji => emoji.id === '464708611260678145') !== undefined ? '<:success:464708611260678145>' : ':white_check_mark:';
    const xmark = msg.guild.emojis.find(emoji => emoji.id === '464708589123141634') !== undefined ? '<:xmark:464708589123141634>' : ':x:';
    const settings = await this.database.automod.get(msg.guild.id);
    const result = await this.database.automod.update(msg.guild.id, {
      spam: !settings!.spam
    });

    return msg.reply(result.affected === 1 ? checkmark : xmark);
  }

  @Subcommand()
  async raid(msg: CommandMessage) {
    const checkmark = msg.guild.emojis.find(emoji => emoji.id === '464708611260678145') !== undefined ? '<:success:464708611260678145>' : ':white_check_mark:';
    const xmark = msg.guild.emojis.find(emoji => emoji.id === '464708589123141634') !== undefined ? '<:xmark:464708589123141634>' : ':x:';
    const settings = await this.database.automod.get(msg.guild.id);
    const result = await this.database.automod.update(msg.guild.id, {
      raid: !settings!.raid
    });

    return msg.reply(result.affected === 1 ? checkmark : xmark);
  }
}
