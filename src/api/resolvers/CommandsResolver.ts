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

import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import LocalizationService from '../../services/LocalizationService';
import type { NinoContext } from '../API';
import { CommandObject } from '../objects/CommandObject';
import CommandService from '../../services/CommandService';

@Resolver(CommandObject)
export default class CommandsResolver {
  @Query(() => [CommandObject], { description: 'Returns all the commands available.' })
  commands(
    @Arg('locale', { defaultValue: 'en_US' }) locale: string,
    @Ctx() { container }: NinoContext
  ) {
    const commands = container.$ref<CommandService>(CommandService);
    const localization = container.$ref<LocalizationService>(LocalizationService);
    const language = localization.locales.find(l => l.code === locale || l.aliases.includes(locale));
    if (language === null)
      throw new TypeError(`Locale "${locale}" was not found.`);

    // owner commands are hidden, so this filter will work with non owner commands :D
    return commands.toArray().filter(c => !c.hidden).map(c => ({
      ...c,
      description: c.description.startsWith('descriptions') ? language.translate(c.description) : c.description
    }));
  }

  @Query(() => CommandObject, { description: 'Returns a single command.' })
  command(
    @Arg('command') command: string,
    @Arg('locale', { defaultValue: 'en_US' }) locale: string,
    @Ctx() { container }: NinoContext
  ) {
    const commands = container.$ref<CommandService>(CommandService);
    const cmd = commands.filter(c => !c.hidden).find(c => c.name === command || c.aliases.includes(command));
    const localization = container.$ref<LocalizationService>(LocalizationService);
    const language = localization.locales.find(l => l.code === locale || l.aliases.includes(locale));

    if (cmd === undefined)
      throw new TypeError(`Command "${command}" was not found.`);

    if (language === null)
      throw new TypeError(`Locale "${locale}" was not found.`);

    return {
      ...cmd,
      description: cmd.description.startsWith('descriptions') ? language.translate(cmd.description) : cmd.description
    };
  }
}
