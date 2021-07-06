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
import { Categories, Color } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import { TextChannel } from 'eris';

export default class AutomodCommand extends Command {
  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord

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
    const settings = await this.database.automod.get(msg.guild.id);
    const embed = new EmbedBuilder()
      .setColor(Color)
      .setDescription([
        `• ${settings!.shortLinks ? msg.successEmote : msg.errorEmote} **Short Links** (\`${msg.settings.prefixes[0]}automod shortlinks\`)`,
        `• ${settings!.blacklist ? msg.successEmote : msg.errorEmote} **Blacklist Words** (\`${msg.settings.prefixes[0]}automod blacklist\`)`,
        `• ${settings!.mentions ? msg.successEmote : msg.errorEmote} **Mentions** (\`${msg.settings.prefixes[0]}automod mentions\`)`,
        `• ${settings!.dehoist ? msg.successEmote : msg.errorEmote} **Dehoisting** (\`${msg.settings.prefixes[0]}automod dehoist\`)`,
        `• ${settings!.invites ? msg.successEmote : msg.errorEmote} **Invites** (\`${msg.settings.prefixes[0]}automod invites\`)`,
        `• ${settings!.raid ? msg.successEmote : msg.errorEmote} **Raids** (\`${msg.settings.prefixes[0]}automod raid\`)`,
        `• ${settings!.spam ? msg.successEmote : msg.errorEmote} **Spam** (\`${msg.settings.prefixes[0]}automod spam\`)`
      ]);

    return msg.reply(embed);
  }

  @Subcommand()
  async shortlinks(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const result = await this.database.automod.update(msg.guild.id, {
      shortLinks: !settings!.shortLinks
    });

    return msg.reply(result.affected === 1 ? msg.successEmote : msg.errorEmote);
  }

  @Subcommand('[...words]')
  async blacklist(msg: CommandMessage, [...words]: [...string[]]) {
    const settings = await this.database.automod.get(msg.guild.id);

    if (!words.length) {
      const type = !settings!.blacklist;

      await this.database.automod.update(msg.guild.id, { blacklist: type });
      return msg.reply(`${type ? msg.successEmote : msg.errorEmote} Successfully **${type ? 'enabled' : 'disabled'}** the Blacklist automod feature.`);
    }

    const curr = settings!.blacklistWords.concat(words);
    const result = await this.database.automod.update(msg.guild.id, {
      blacklistWords: curr
    });

    return msg.reply(result.affected === 1 ? msg.successEmote : msg.errorEmote);
  }

  @Subcommand()
  async mentions(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const result = await this.database.automod.update(msg.guild.id, {
      mentions: !settings!.mentions
    });

    return msg.reply(result.affected === 1 ? msg.successEmote : msg.errorEmote);
  }

  @Subcommand()
  async invites(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const result = await this.database.automod.update(msg.guild.id, {
      invites: !settings!.invites
    });

    return msg.reply(result.affected === 1 ? msg.successEmote : msg.errorEmote);
  }

  @Subcommand()
  async dehoist(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const result = await this.database.automod.update(msg.guild.id, {
      dehoist: !settings!.dehoist
    });

    return msg.reply(result.affected === 1 ? msg.successEmote : msg.errorEmote);
  }

  @Subcommand()
  async spam(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const result = await this.database.automod.update(msg.guild.id, {
      spam: !settings!.spam
    });

    return msg.reply(result.affected === 1 ? msg.successEmote : msg.errorEmote);
  }

  @Subcommand('[...channels]')
  async raid(msg: CommandMessage, [...channels]: string[]) {
    if (!channels.length) {
      const settings = await this.database.automod.get(msg.guild.id);
      const result = await this.database.automod.update(msg.guild.id, {
        raid: !settings!.raid
      });

      return msg.reply(result.affected === 1 ? msg.successEmote : msg.errorEmote);
    }

    const automod = await this.database.automod.get(msg.guild.id);
    const found = await Promise.all(channels.map(chanID => this.discord.getChannel<TextChannel>(chanID)));
    const chans = found.filter(c => c !== null && c.type !== 0).map(s => s!.id);
    const result = await this.database.automod.update(msg.guild.id, {
      whitelistChannelsDuringRaid: automod!.whitelistChannelsDuringRaid.concat(chans)
    });

    return msg.reply(`${result.affected === 1 ? msg.successEmote : msg.errorEmote} Added **${chans.length}** channels to the whitelist.`);
  }
}
