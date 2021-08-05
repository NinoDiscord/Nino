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

import { Command, CommandMessage } from '../../structures';
import { Categories } from '../../util/Constants';
import { inspect } from 'util';
import { Inject } from '@augu/lilith';
import Stopwatch from '../../util/Stopwatch';
import Config from '../../components/Config';

export default class EvalCommand extends Command {
  @Inject
  private config!: Config;

  constructor() {
    super({
      description: 'Evaluates JavaScript code and return a clean output',
      ownerOnly: true,
      hidden: true,
      category: Categories.Owner,
      aliases: ['evl', 'ev', 'js'],
      name: 'eval',
    });
  }

  async run(msg: CommandMessage, args: string[]) {
    if (!args.length) return msg.reply('What do you want me to evaluate?');

    let script = args.join(' ');
    let result: any;
    let depth = 1;

    const flags = msg.flags<{
      depth?: string | true;
      slient?: string | true;
      s?: string | true;
    }>();

    if (flags.depth === true) return msg.reply('`--depth` flag requires a input. Example: `--depth 1`');

    if (flags.depth !== undefined) {
      depth = Number(flags.depth);
      if (isNaN(depth)) return msg.reply('Depth value was not a number');

      script = script.replace(`--depth=${depth}`, '');
    }

    if (script.startsWith('```js') && script.endsWith('```')) {
      script = script.replace('```js', '');
      script = script.replace('```', '');
    }

    const stopwatch = new Stopwatch();
    const isAsync = script.includes('return') || script.includes('await');
    const slient = flags.slient === true || flags.s === true;

    stopwatch.start();
    try {
      result = eval(isAsync ? `(async()=>{${script}})()` : script);

      const time = stopwatch.end();
      let asyncTimer: string | undefined = undefined;
      if (result instanceof Promise) {
        stopwatch.restart();
        result = await result;

        asyncTimer = stopwatch.end();
      }

      if (typeof result !== 'string')
        result = inspect(result, {
          depth,
          showHidden: false,
        });

      if (slient) return;

      const res = this.redact(result);
      return msg.reply(
        [`:timer: **${asyncTimer !== undefined ? `${time}<${asyncTimer}>` : time}**`, '', '```js', res, '```'].join(
          '\n'
        )
      );
    } catch (ex) {
      const time = stopwatch.end();
      return msg.reply([`:timer: **${time}**`, '', '```js', ex.stack ?? '<... no stacktrace ...>', '```'].join('\n'));
    }
  }

  private redact(script: string) {
    const rawConfig = this.config['config']; // yes we need the raw config cuz i dont feel like using .getProperty :woeme:
    let tokens = [
      ...(rawConfig.redis.sentinels?.map((r) => r.host) ?? []),
      rawConfig.database.username,
      rawConfig.database.password,
      rawConfig.redis.password,
      rawConfig.database.host,
      rawConfig.database.url,
      rawConfig.redis.host,
      rawConfig.sentryDsn,
      rawConfig.ksoft,
      rawConfig.token,
    ];

    if (rawConfig.botlists !== undefined)
      tokens.push(
        rawConfig.botlists.dservices,
        rawConfig.botlists.dboats,
        rawConfig.botlists.topgg,
        rawConfig.botlists.delly,
        rawConfig.botlists.dbots,
        rawConfig.botlists.bfd
      );

    tokens = tokens.filter(Boolean);
    return script.replace(new RegExp(tokens.join('|'), 'gi'), 'owo? nu!!!');
  }
}
