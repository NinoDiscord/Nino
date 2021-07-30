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

import { getSubcommandsIn } from './decorators/Subcommand';
import type CommandMessage from './CommandMessage';
import type { Constants } from 'eris';
import { Categories } from '../util/Constants';
import Subcommand from './Subcommand';

export type PermissionField = keyof Constants['Permissions'];
interface CommandInfo {
  userPermissions?: PermissionField | PermissionField[];
  botPermissions?: PermissionField | PermissionField[];
  description?: string;
  ownerOnly?: boolean;
  examples?: string[];
  category?: Categories;
  cooldown?: number;
  aliases?: string[];
  hidden?: boolean;
  usage?: string;
  name: string;
}

export default abstract class NinoCommand {
  public userPermissions: PermissionField[];
  public botPermissions: PermissionField[];
  public description: ObjectKeysWithSeperator<LocalizationStrings>;
  public ownerOnly: boolean;
  public examples: string[];
  public category: Categories;
  public cooldown: number;
  public aliases: string[];
  public hidden: boolean;
  public usage: string;
  public name: string;

  constructor(info: CommandInfo) {
    this.userPermissions =
      typeof info.userPermissions === 'string'
        ? [info.userPermissions]
        : Array.isArray(info.userPermissions)
          ? info.userPermissions
          : [];

    this.botPermissions =
      typeof info.botPermissions === 'string'
        ? [info.botPermissions]
        : Array.isArray(info.botPermissions)
          ? info.botPermissions
          : [];

    this.description =
      (info.description as unknown as ObjectKeysWithSeperator<LocalizationStrings>) ??
      'descriptions.unknown';
    this.ownerOnly = info.ownerOnly ?? false;
    this.examples = info.examples ?? [];
    this.category = info.category ?? Categories.Core;
    this.cooldown = info.cooldown ?? 5;
    this.aliases = info.aliases ?? [];
    this.hidden = info.hidden ?? false;
    this.usage = info.usage ?? '';
    this.name = info.name;
  }

  get subcommands() {
    return getSubcommandsIn(this).map((sub) => new Subcommand(sub));
  }

  get format() {
    const subcommands = this.subcommands
      .map((sub) => `[${sub.name} ${sub.usage.trim()}]`.trim())
      .join(' | ');
    return `${this.name}${
      this.usage !== '' ? ` ${this.usage.trim()}` : ''
    } ${subcommands}`;
  }

  abstract run(msg: CommandMessage, ...args: any[]): any;
}
