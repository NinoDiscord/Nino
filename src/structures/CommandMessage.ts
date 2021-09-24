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

import type { Message, TextChannel } from 'eris';
import type { Users, Guilds } from '.prisma/client';
import Language from './Language';

/**
 * Represents a message that is for commands.
 */
export default class CommandMessage<Args extends Record<string, any> = {}, Flags extends Record<string, any> = {}> {
  #message: Message<TextChannel>;

  /**
   * The user settings available in this message.
   */
  userSettings: Users;

  /**
   * The guild settings available in this message.
   */
  settings: Guilds;

  /**
   * The guild or user language to use to translate.
   */
  language: Language;

  /**
   * The flags available, if there is none, it'll return an empty object.
   */
  flags: Flags;

  /**
   * The arguments available, if there is none, it'll return an empty object.
   */
  args: Args;

  /**
   * @param message The original message
   * @param language The user or guild language to translate messages.
   * @param settings The guild settings to use.
   * @param userSettings The user settings to use.
   * @param args The arguments available, if there is none, it'll return an empty object.
   * @param flags The flags available, if there is none, it'll return an empty object.
   */
  constructor(
    message: Message<TextChannel>,
    language: Language,
    settings: Guilds,
    userSettings: Users,
    args: Args = {} as unknown as Args,
    flags: Flags = {} as unknown as Flags
  ) {
    this.userSettings = userSettings;
    this.#message = message;
    this.settings = settings;
    this.language = language;
    this.flags = flags;
    this.args = args;
  }

  /**
   * Returns the guild this command was executed in
   */
  get guild() {
    return this.#message.channel.guild;
  }

  /**
   * Returns the command executor as a Member object.
   */
  get member() {
    return this.guild.members.get(this.#message.author.id)!;
  }

  /**
   * Returns the command executor as a User object.
   */
  get author() {
    return this.#message.author;
  }

  /**
   * Returns the message attachments, if any.
   */
  get attachments() {
    return this.#message.attachments;
  }
}
