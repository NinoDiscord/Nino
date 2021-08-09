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
  private readonly discord!: Discord;

  constructor() {
    super({
      userPermissions: 'manageGuild',
      description: 'descriptions.automod',
      category: Categories.Settings,
      examples: ['automod', 'automod spam', 'automod blacklist uwu owo'],
      name: 'automod',
    });
  }

  async run(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const embed = new EmbedBuilder()
      .setColor(Color)
      .setDescription([
        `• ${settings!.shortLinks ? msg.successEmote : msg.errorEmote} **Short Links** (\`${
          msg.settings.prefixes[0]
        }automod shortlinks\`)`,
        `• ${settings!.blacklist ? msg.successEmote : msg.errorEmote} **Blacklist Words** (\`${
          msg.settings.prefixes[0]
        }automod blacklist\`)`,
        `• ${settings!.mentions ? msg.successEmote : msg.errorEmote} **Mentions** (\`${
          msg.settings.prefixes[0]
        }automod mentions\`)`,
        `• ${settings!.dehoist ? msg.successEmote : msg.errorEmote} **Dehoisting** (\`${
          msg.settings.prefixes[0]
        }automod dehoist\`)`,
        `• ${settings!.invites ? msg.successEmote : msg.errorEmote} **Invites** (\`${
          msg.settings.prefixes[0]
        }automod invites\`)`,
        `• ${settings!.raid ? msg.successEmote : msg.errorEmote} **Raids** (\`${
          msg.settings.prefixes[0]
        }automod raid\`)`,
        `• ${settings!.spam ? msg.successEmote : msg.errorEmote} **Spam** (\`${
          msg.settings.prefixes[0]
        }automod spam\`)`,
      ]);

    return msg.reply(embed);
  }

  @Subcommand()
  async shortlinks(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const enabled = !settings!.shortLinks;

    await this.database.automod.update(msg.guild.id, {
      shortLinks: enabled,
    });

    return msg.reply(`${enabled ? msg.successEmote : msg.errorEmote} the Shortlinks automod feature`);
  }

  @Subcommand('[...words | "remove" ...words | "list"]')
  async blacklist(msg: CommandMessage, [...words]: [...string[]]) {
    const settings = await this.database.automod.get(msg.guild.id);

    if (!words.length) {
      const type = !settings!.blacklist;
      const res = await this.database.automod.update(msg.guild.id, {
        blacklist: type,
      });

      const suffix = res ? 'd' : '';
      return msg.reply(
        `${res ? `${msg.successEmote} Successfully` : `${msg.errorEmote} Unable to`} **${
          type ? `enable${suffix}` : `disable${suffix}`
        }** the Blacklist automod feature.`
      );
    }

    if (words[0] === 'remove') {
      // Remove argument "remove" from the words list
      words.shift();

      const all: string[] = settings!.blacklistWords;
      for (const word of words) {
        const index = all.indexOf(word);
        if (index !== -1) all.splice(index, 1);
      }

      await this.database.automod.update(msg.guild.id, {
        blacklistWords: all,
      });

      return msg.success('Successfully removed the blacklisted words. :D');
    }

    if (words[0] === 'list') {
      const automod = await this.database.automod.get(msg.guild.id);
      const embed = EmbedBuilder.create()
        .setTitle('Blacklisted Words')
        .setDescription([
          `:eyes: Hi **${msg.author.tag}**, I would like to inform you that I'll be deleting this message in 10 seconds`,
          "due to the words that are probably blacklisted, don't want to offend anyone. :c",
          '',
          automod!.blacklistWords.map((s) => `\`${s}\``).join(', '),
        ]);

      return msg.reply(embed).then((m) => setTimeout(() => m.delete(), 10_000));
    }

    const curr = settings!.blacklistWords.concat(words);
    await this.database.automod.update(msg.guild.id, {
      blacklistWords: curr,
    });

    return msg.success('Successfully added the words to the blacklist. :3');
  }

  @Subcommand()
  async mentions(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const type = !settings!.mentions;

    await this.database.automod.update(msg.guild.id, {
      mentions: type,
    });

    return msg.reply(
      `${type ? `${msg.successEmote} **Enabled**` : `${msg.errorEmote} **Disabled**`} Mentions automod feature.`
    );
  }

  @Subcommand()
  async invites(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const t = !settings!.invites;

    await this.database.automod.update(msg.guild.id, {
      invites: !settings!.invites,
    });

    return msg.reply(
      `${t ? `${msg.successEmote} **Enabled**` : `${msg.errorEmote} **Disabled**`} Invites automod feature.`
    );
  }

  @Subcommand()
  async dehoist(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const t = !settings!.dehoist;

    await this.database.automod.update(msg.guild.id, {
      dehoist: !settings!.dehoist,
    });

    return msg.reply(
      `${t ? `${msg.successEmote} **Enabled**` : `${msg.errorEmote} **Disabled**`} Dehoisting automod feature.`
    );
  }

  @Subcommand()
  async spam(msg: CommandMessage) {
    const settings = await this.database.automod.get(msg.guild.id);
    const t = !settings!.spam;

    await this.database.automod.update(msg.guild.id, {
      spam: t,
    });

    return msg.reply(
      `${t ? `${msg.successEmote} **Enabled**` : `${msg.errorEmote} **Disabled**`} Spam automod feature.`
    );
  }
}
