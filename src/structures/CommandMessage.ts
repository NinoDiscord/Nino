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
import { NotInjectable } from '@augu/lilith';
import { EmbedBuilder } from '.';
import Discord from '../components/Discord';
import app from '../container';

@NotInjectable()
export default class CommandMessage {
  private _flags: any = {};

  #message: Message<TextChannel>;

  constructor(message: Message<TextChannel>) {
    this.#message = message;
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
    // @ts-expect-error (fuck you)
    const discord = app.$ref<Discord>(Discord);
    return this.guild.members.get(discord.client.user.id);
  }

  flags<T extends object>(): T {
    return this._flags;
  }

  reply(content: string | EmbedBuilder) {
    const payload: AdvancedMessageContent = {
      messageReferenceID: this.#message.id,
      allowedMentions: {
        replied_user: false, // eslint-disable-line camelcase
        everyone: false,
        roles: false,
        users: false
      }
    };

    if (typeof content === 'string') {
      payload.content = content;
      return this.channel.createMessage(payload);
    } else {
      if (this.guild) {
        if (this.self?.permissions.has('embedLinks'))
          return this.channel.createMessage({ embed: content.build(), ...payload });
        else
          // TODO: unembedify util
          return this.channel.createMessage({ content: content.description!, ...payload });
      } else {
        return this.channel.createMessage({ embed: content.build(), ...payload });
      }
    }
  }
}
