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

@NotInjectable()
export default class CommandMessage {
  private _cmdArgs: any = {};

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

  args<T extends object>(): T {
    return this._cmdArgs;
  }

  reply(content: string | EmbedBuilder) {
    const payload: AdvancedMessageContent = {
      allowedMentions: {
        everyone: false,
        roles: false,
        users: false
      }
    };
  }
}

/*
  send(content: string) {
    return this.message.channel.createMessage({
      content,
      allowedMentions: {
        everyone: false,
        roles: false,
        users: false
      }
    });
  }

  embed(content: EmbedOptions) {
    if (this.guild) {
      if (this.me!.permission.has('embedLinks')) {
        return this.message.channel.createMessage({ embed: content });
      } else {
        return this.send(unembedify(content));
      }
    } else {
      return this.message.channel.createMessage({ embed: content });
    }
  }
*/
