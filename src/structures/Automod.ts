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

import type { Member, Message, TextChannel, User } from 'eris';

/**
 * Interface to implement as a [Automod] action.
 */
export interface Automod {
  /**
   * Handles any member's nickname updates
   * @param member The member
   */
  onMemberNickUpdate?(member: Member): Promise<boolean>;

  /**
   * Handles any user updates
   */
  onUserUpdate?(user: User): Promise<boolean>;

  /**
   * Handles any members joining the guild
   * @param member The member
   */
  onMemberJoin?(member: Member): Promise<boolean>;

  /**
   * Handles any message updates or creation
   * @param message The message
   */
  onMessage?(message: Message<TextChannel>): Promise<boolean>;

  /**
   * The name for this [Automod] class.
   */
  name: string;
}
