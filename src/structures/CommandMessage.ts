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

import type { AdvancedMessageContent, Message, TextChannel } from 'eris';
import type { ActionRow, ActionRowChild } from 'slash-commands';
import type GuildEntity from '../entities/GuildEntity';
import { EmbedBuilder } from '.';
import type UserEntity from '../entities/UserEntity';
import type Locale from './Locale';
import { Inject } from '@augu/lilith';
import Discord from '../components/Discord';
import { Filter } from './MessageCollector';

interface ComponentsAdvancedMessageContent extends AdvancedMessageContent {
  components?: ActionRow[];
}

export default class CommandMessage {
  public userSettings: UserEntity;
  public settings: GuildEntity;
  private _flags: any = {};
  public locale: Locale;
  #message: Message<TextChannel>;

  @Inject
  private discord!: Discord;

  constructor(message: Message<TextChannel>, locale: Locale, settings: GuildEntity, userSettings: UserEntity) {
    this.userSettings = userSettings;
    this.settings = settings;
    this.#message = message;
    this.locale = locale;
  }

  get attachments() {
    return this.#message.attachments;
  }

  get channel() {
    return this.#message.channel;
  }

  get author() {
    return this.#message.author;
  }

  get member() {
    return this.#message.member;
  }

  get guild() {
    return this.#message.channel.guild;
  }

  get self() {
    return this.guild.members.get(this.discord.client.user.id);
  }

  get successEmote() {
    return this.discord.emojis.find((e) => e === '<:success:464708611260678145>') ?? ':black_check_mark:';
  }

  get errorEmote() {
    return this.discord.emojis.find((e) => e === '<:xmark:464708589123141634>') ?? ':x:';
  }

  flags<T extends object>(): T {
    return this._flags;
  }

  translate<K extends ObjectKeysWithSeperator<LocalizationStrings>>(key: K, args?: any[] | Record<string, any>) {
    return this.reply(this.locale.translate(key, args));
  }

  reply(content: string | EmbedBuilder, components?: ActionRowChild[]) {
    const payload: ComponentsAdvancedMessageContent = {
      components: components !== undefined ? [{ type: 1, components }] : undefined,
      messageReference: { messageID: this.#message.id },
      allowedMentions: {
        repliedUser: false,
        everyone: false,
        roles: false,
        users: false,
      },
    };

    if (typeof content === 'string') {
      payload.content = content;
      return this.channel.createMessage(payload);
    } else {
      if (this.guild) {
        if (this.self?.permissions.has('embedLinks'))
          return this.channel.createMessage({
            embed: content.build(),
            ...payload,
          });
        // TODO: unembedify util
        else
          return this.channel.createMessage({
            content: content.description!,
            ...payload,
          });
      } else {
        return this.channel.createMessage({
          embed: content.build(),
          ...payload,
        });
      }
    }
  }

  success(content: string) {
    return this.reply(`${this.successEmote} ${content}`);
  }

  error(content: string) {
    return this.reply(`${this.errorEmote} ${content}`);
  }

  async awaitReply(content: string | EmbedBuilder, time: number, filter: Filter) {
    const message = await this.reply(content);
    const replied = await this.#message.collector.awaitMessage(filter, {
      channel: this.channel.id,
      author: this.author.id,
      time,
    });

    if (replied === null) {
      await message.delete();
      return this.error("**Didn't receive anything, assuming to cancel.**");
    }

    return replied;
  }
}
