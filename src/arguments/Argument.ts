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

import { withIndex } from '../util';
import StringBuilder from '../util/StringBuilder';

/**
 * Represents the argument type.
 */
export enum ArgumentType {
  /**
   * The `time` argument is represented as a time string. Which can be:
   *
   * - `1d`
   * - `1 day`
   * - `1 day 12 hours`
   */
  Time = 'time',

  /**
   * The `string` argument can be anything the user has inputted. If this argument isn't
   * a rest / multi argument, which will be considered "vague" since the argument parser isn't
   * validating what this argument will be.
   */
  String = 'string',

  /**
   * Represents a integer argument, which can be any literal number like 1, 2, 3928293, etc. This will not
   * count for `NaN` results, which will result in a argument exception.
   */
  Int = 'int',

  /**
   * Represents a member argument, which can be any user that is present in a guild and will not account for
   * users not in this guild.
   */
  Member = 'member',

  /**
   * Represents a text channel, which can be a literal text channel like **#general**.
   */
  TextChannel = 'text',

  /**
   * Represents a **user** argument, which can be any user that can be present in a guild or a user that
   * isn't in the guild. :3
   */
  User = 'user',
}

/**
 * Returns the argument information for constructing {@link Argument}s.
 */
export interface ArgumentInfo {
  /**
   * Returns the default value, if any
   */
  defaultValue?: any;

  /**
   * Checks if this Argument is a optional argument.
   */
  isOptional: boolean;

  /**
   * Checks if this Argument is a required argument.
   */
  isRequired: boolean;

  /**
   * Checks if this Argument can be considered null.
   */
  isNullable: boolean;

  /**
   * Checks if this Argument is a multi argument.
   */
  isMulti: boolean;

  /**
   * Checks if this Argument is a rest argument.
   */
  isRest: boolean;

  /**
   * Returns the available type(s) for this Argument.
   */
  type: ArgumentType | ArgumentType[];

  /**
   * The name of the argument
   */
  name: string;
}

/**
 * Represents a instance of a argument. Arguments are a list of strings (when intepreted from `@Nino ban` -> `prefix command ...args`),
 * they represent some value, which can be a string, text channel, member, etc.
 *
 * ```md
 * nino     ban @August#5820 @Ice#4710 @Rodentman87#8787 @Polarboi#5523
 *   |       |      |            |         |                  |
 *   |       |      \            |         |                  /
 *   |       |       \           |         |                 /
 *   |       |        \          |         |                /
 *   |       |         \         |         |               /
 * prefix   cmd       list of arguments represented as "multi" args
 * ```
 *
 * A argument might look like this in the command or subcommand's usage:
 *
 * `<users:...user:multi> [time?:time|...string] [reason?:...string="No reason specified."]`
 *
 * This is split by:
 * * `<users:...user:multi>`
 *    * `<>` wrapped means required. You can find this with the {@link Argument.isRequired} getter.
 *    * `[]` wrapped means optional. You can find this with the {@link Argument.isOptional} getter.
 *    * `users:` means the argument name when retriveving from `CommandMessage#args` will be "users"
 *    * `...user` represents a rest argument, which means it'll keep contiuing users and skip `time` and `reason`, which we don't want that sometimes.
 *    * `:multi` represents a modifier, which will use the MultiArgumentResolver over the RestArgumentResolver, which won't skip over `time` and `reason`
 * * `[time?:time|string]`
 *    * `?:` represents a optional argument, the executor doesn't need to provide this argument or it can be `undefined`, which means they skipped over it.
 *    * `|` represents A **OR** operation, which will coceerse over the `time` argument and `...string` rest argument, which will result in a UnionArgumentResolver.
 */
export class Argument {
  /**
   * Returns the default value, if any
   */
  defaultValue?: any;

  /**
   * Checks if this Argument is a optional argument.
   */
  isOptional: boolean;

  /**
   * Checks if this Argument is a required argument.
   */
  isRequired: boolean;

  /**
   * Checks if this Argument can be considered null.
   */
  isNullable: boolean;

  /**
   * Checks if this Argument is a multi argument.
   */
  isMulti: boolean;

  /**
   * Checks if this Argument is a rest argument.
   */
  isRest: boolean;

  /**
   * Returns the available type(s) for this Argument.
   */
  type: ArgumentType | ArgumentType[];

  /**
   * The name of the argument
   */
  name: string;

  constructor({ defaultValue, isOptional, isRequired, isMulti, isNullable, isRest, type, name }: ArgumentInfo) {
    this.defaultValue = defaultValue;
    this.isOptional = isOptional;
    this.isRequired = isRequired;
    this.isNullable = isNullable;
    this.isMulti = isMulti;
    this.isRest = isRest;
    this.type = type;
    this.name = name;
  }

  /**
   * Returns the format of the argument.
   */
  get format() {
    const builder = new StringBuilder();

    // Will append "[users?:" for an example as an example
    builder.append(`${this.isRequired ? '<' : '['}${this.name}${this.isNullable ? '?:' : ':'}`);

    const types = Array.isArray(this.type) ? this.type : [this.type];
    for (const [index, type] of withIndex(types)) {
      // Will append "...users:user:multi" as an example
      builder.append(
        `${this.isRest ? '...' : ''}${type}${this.isMulti ? ':multi' : ''}${
          this.defaultValue !== undefined ? `=${this.defaultValue}` : ''
        }${index + 1 === types.length ? '' : '|'}`
      );
    }

    // Will append > if required else ]
    builder.append(this.isRequired ? '>' : ']');
    return builder.build();
  }

  /**
   * Returns the simplest format of this argument
   */
  get simpleFormat() {
    const builder = new StringBuilder();
    builder.append(
      `${this.isRequired ? '<' : '['}${this.name}: ${this.type} = ${
        this.defaultValue !== undefined ? this.defaultValue : ''
      }${this.isRequired ? '>' : ']'}`
    );

    if (this.isNullable) builder.append(' (nullable, argument will be not present)');
    if (this.isMulti) builder.append(' (multiple objects can be represented in this argument)');
    if (this.isRest) builder.append(' (argument can be infinite)');

    return builder.build();
  }
}
