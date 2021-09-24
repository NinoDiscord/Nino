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

import { CommandCategory, MetadataKeys } from '~/utils/Constants';
import { SubcommandInfo } from './Subcommand';
import type { Constants } from 'eris';

/**
 * Returns the permission as the key from `require('eris').Constants`
 */
export type Permissions = keyof typeof Constants['Permissions'];

/**
 * Represents the command information applied to a {@link AbstractCommand command}.
 */
export interface CommandInfo {
  /**
   * Returns a object of permissions based off the user and Nino itself.
   */
  permissions?: Record<'user' | 'bot', Permissions | Permissions[]>;

  /**
   * If this {@link AbstractCommand command} is for the owners of the bot.
   */
  ownerOnly?: boolean;

  /**
   * A list of examples to guide the user to the right direction.
   */
  examples?: string[];

  /**
   * The category this command belongs to, it'll default to {@link CommandCategory.Core}.
   */
  category?: CommandCategory;

  /**
   * In seconds, to determine to "ratelimit" the user for using this command or it'll
   * prompt a "You can use this command <x amount of seconds>" message.
   */
  cooldown?: number;

  /**
   * External triggers this command has.
   */
  aliases?: string[];

  /**
   * Returns the description for this {@link AbstractCommand command}.
   */
  description: StringLiteralUnion<ObjectKeysWithSeperator<LocalizationStrings>>;

  /**
   * Returns the command's name, this is techincally the first "alias".
   */
  name: string;
}

/**
 * Represents an abstraction for running prefixed commands with Nino. Normally, you cannot
 * apply metadata to this class, it'll be under the `nino::commands` symbol when using `Reflect.getMetadata`.
 */
export default abstract class AbstractCommand {
  /**
   * Returns the command's metadata about this {@link AbstractCommand command}.
   */
  get info() {
    return Reflect.getMetadata<CommandInfo>(MetadataKeys.Command, this.constructor);
  }

  /**
   * Returns the subcommands registered in this {@link AbstractCommand command}, or a empty array
   * if none were.
   */
  get subcommands(): SubcommandInfo[] {
    return Reflect.getMetadata<SubcommandInfo[] | undefined>(MetadataKeys.Subcommand, this.constructor) ?? [];
  }

  /**
   * Runs this command and returns an output, if any.
   * @param msg The command message that is constructed when this {@link AbstractCommand command} is found.
   */
  abstract run(): any;
}
