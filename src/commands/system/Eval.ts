import { writeFileSync, unlinkSync } from 'fs';
import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { inspect } from 'util';
import { Module } from '../../util';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import ts from 'typescript';

class CompilerError extends Error {
  constructor(m: string) {
    super(m);

    this.name = 'TypeScriptError';
  }
}

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
    const message = await ctx.send('Now evaluating script...');
    let script = ctx.args.join(' ');
    let result: any;
    let depthSize = 1;

    const typescript = ctx.flags.get('ts');
    if (typeof typescript === 'string') {
      const language = this.bot.locales.get('en_US')!;
      return ctx.send(language.translate('global.invalidFlag.boolean', { flag: 'ts' }));
    }

    const isAsync = script.includes('return') || script.includes('await');
    const depth = ctx.flags.get('depth');

    if (typeof depth === 'boolean') {
      const language = this.bot.locales.get('en_US')!;
      return ctx.send(language.translate('global.invalidFlag.string', { flag: 'depth' }));
    }

    if (typescript) {
      script = script.replace('--ts', '');
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
      if (typescript) result = eval(this.compileTypescript(isAsync ? `(async() => {${script}})()` : script));
      result = eval(isAsync ? `(async()=>{${script}})();` : script);

      if (result instanceof Promise) result = await result;
      if (typeof result !== 'string')
        result = inspect(result, {
          depth: depthSize,
          showHidden: false,
        });

      const _res = this.redact(result);
      await message.edit([
        '```js',
        _res,
        '```'
      ].join('\n'));
    } catch (e) {
      await message.edit([
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

  // Stolen from: https://github.com/yamdbf/core/blob/master/src/command/base/EvalTS.ts#L68-L96
  compileTypescript(script: string) {
    const file = `${process.cwd()}${require('path').sep}data${require('path').sep}eval_${Date.now()}.ts`;
    writeFileSync(file, script);

    const program = ts.createProgram([file], {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.CommonJS,
      lib: [
        'lib.es2015.d.ts',
        'lib.es2016.d.ts',
        'lib.es2017.d.ts',
        'lib.es2018.d.ts',
        'lib.es2019.d.ts',
        'lib.es2020.d.ts',
        'lib.esnext.d.ts',
      ],
      declaration: false,
      strict: true,
      noImplicitAny: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      experimentalDecorators: true,
      emitDeclarationMetadata: true,
    });

    let diagnostics = ts.getPreEmitDiagnostics(program);
    let message!: string;
    if (diagnostics.length) {
      for (const diagnostic of diagnostics) {
        const _msg = diagnostic.messageText;
        const _file = diagnostic.file;
        const line = _file
          ? _file.getLineAndCharacterOfPosition(diagnostic.start!)
          : undefined;

        //* Unable to get 'line' and 'character', reduce it to the message that the diagnostic returned
        if (line === undefined) {
          message = _msg.toString();
          break;
        }

        const _line = line.line + 1;
        const _char = line.character + 1;
        message = `${_msg} (at '${_line}:${_char}')`;
      }
    }

    unlinkSync(file);
    if (message) throw new CompilerError(message);

    return ts.transpileModule(script, {
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        lib: [
          'lib.es2015.d.ts',
          'lib.es2016.d.ts',
          'lib.es2017.d.ts',
          'lib.es2018.d.ts',
          'lib.es2019.d.ts',
          'lib.es2020.d.ts',
          'lib.esnext.d.ts',
        ],
        declaration: false,
        strict: true,
        noImplicitAny: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDeclarationMetadata: true,
      },
    }).outputText;
  }
}
