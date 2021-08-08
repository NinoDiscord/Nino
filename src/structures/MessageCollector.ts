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

import { Message, TextChannel } from 'eris';
import { Collection } from '@augu/collections';
import Discord from '../components/Discord';

export type Filter = (msg: Message<TextChannel>) => boolean;

interface Collector {
  accept(value: Message<TextChannel> | PromiseLike<Message<TextChannel>>): void;

  filter: Filter;
  channel: string;
  author: string;
  time: number;
}

/**
 * Represents a bare bones message collector, which collects a message
 * based on a predicate and returns a value or `null`.
 */
export default class MessageCollector {
  #collection: Collection<string, Collector> = new Collection();

  constructor(discord: Discord) {
    discord.client.on('messageCreate', this.onReact.bind(this));
  }

  private onReact(msg: Message<TextChannel>) {
    if (msg.author.bot) return;

    const result = this.#collection.get(`${msg.author.id}:${msg.channel.id}`);
    if (!result) return;

    if (result.filter(msg)) {
      result.accept(msg);
      this.#collection.delete(`${msg.author.id}:${msg.channel.id}`);
    }
  }

  awaitMessage(filter: Filter, { channel, author, time }: Pick<Collector, 'channel' | 'author' | 'time'>) {
    return new Promise<Message<TextChannel> | null>((accept) => {
      if (this.#collection.has(`${author}:${channel}`)) this.#collection.delete(`${author}:${channel}`);

      this.#collection.set(`${author}:${channel}`, {
        accept,
        filter,
        channel,
        author,
        time,
      });

      setTimeout(accept.bind(null, null), time * 1000);
    });
  }
}
