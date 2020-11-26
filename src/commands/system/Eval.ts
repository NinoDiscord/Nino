import { writeFileSync, unlinkSync } from 'fs';
import { injectable, inject } from 'inversify';
import { inspect } from 'util';
import { Module } from '../../util';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class EvalCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'eval',
      description: 'Evaluates JavaScript code and return a clean output',
      usage: '<script>',
      aliases: ['js', 'evl'],
      category: Module.System,
      ownerOnly: true,
      hidden: true
    });
  }

  async run(ctx: Context) {
    let script = ctx.args.join(' ');
    let result: any;
    let depthSize = 1;

    const depth = ctx.flags.get('depth');

    if (typeof depth === 'boolean') {
      const language = this.bot.locales.get('en_US')!;
      return ctx.send(language.translate('global.invalidFlag.string', { flag: 'depth' }));
    }

    if (depth !== undefined) {
      depthSize = Number(depth);
      if (isNaN(depthSize)) return ctx.send('Depth was not a number.');

      script = script.replace(`--depth=${depth}`, '');
    }

    if (script.startsWith('```js') && script.endsWith('```')) {
      script = script.replace('```js', '');
      script = script.replace('```', '');
    }

    try {
      result = eval(`(async()=>{${script}})()`);

      if (result instanceof Promise) result = await result;
      if (typeof result !== 'string')
        result = inspect(result, {
          depth: depthSize,
          showHidden: false,
        });

      const _res = this.redact(result);
      return ctx.send([
        '```js',
        _res,
        '```'
      ].join('\n'));
    } catch (e) {
      return ctx.send([
        '```js',
        e.stack || 'None',
        '```'
      ].join('\n'));
    }
  }

  redact(script: string) {
    let tokens = [
      this.bot.client.token,
      this.bot.config.databaseUrl,
      this.bot.config.discord.token,
      this.bot.config.redis.host,
      this.bot.config.sentryDSN
    ];

    if (this.bot.config.ksoft) tokens.push(this.bot.config.ksoft);
    if (this.bot.config.botlists) tokens.push(this.bot.config.botlists.bfdtoken, this.bot.config.botlists.blstoken, this.bot.config.botlists.topggtoken, this.bot.config.botlists.dboatstoken, this.bot.config.botlists.dservicestoken, this.bot.config.botlists.deltoken);
    if (this.bot.config.dbAuth) tokens.push(this.bot.config.dbAuth.password);

    tokens = tokens.filter(Boolean);
    const cancellationToken = new RegExp(tokens.join('|'), 'gi');
    return script.replace(cancellationToken, '--snip--');
  }
}
