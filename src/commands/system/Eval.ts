import { inspect } from 'util';
import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import EmbedBuilder from '../../structures/EmbedBuilder';
import ts from 'typescript';
import { writeFileSync, unlinkSync } from 'fs';

class CompilerError extends Error {
  constructor(m: string) {
    super(m);

    this.name = 'CompilerError';
  }
}

export default class EvalCommand extends Command {
  constructor(client: Bot) {
    super(client, {
      name: 'eval',
      description: 'Evaluates JavaScript code and return a clean output',
      usage: '<script>',
      aliases: ['js', 'evl'],
      category: 'System Adminstration',
      ownerOnly: true,
      hidden: true,
    });
  }

  async run(ctx: Context) {
    const message = await ctx.embed(
      new EmbedBuilder()
        .setTitle('Evaluating...')
        .setColor(0x00ff00)
        .build()
    );
    const script = ctx.args.join(' ');
    const startTime = Date.now();
    let result;

    const typescript = ctx.flags.get('ts');
    if (typeof typescript === 'string')
      return ctx.send("Um, I'm sorry but it's just `--ts`");

    const isAsync = script.includes('return') || script.includes('await');

    try {
      if (typescript)
        result = eval(
          this.compileTypescript(
            isAsync ? `(async() => {${script}})()` : script
          )
        );
      result = eval(isAsync ? `(async()=>{${script}})();` : script);
      const evaluationTime = Date.now() - startTime;
      if ((result as any) instanceof Promise) result = await result;
      if (typeof result !== 'string')
        result = inspect(result, {
          depth: +!inspect(result, { depth: 1 }),
          showHidden: false,
        });

      const _res = this._redact(result);
      await message.edit({
        embed: new EmbedBuilder()
          .setTitle('Evauluation')
          .addField(
            ':scroll: Script :scroll:',
            `\`\`\`js\n${script}\n\`\`\``,
            false
          )
          .addField(
            ':white_check_mark: Result :white_check_mark:',
            `\`\`\`js\n${_res}\n\`\`\``,
            false
          )
          .addField(
            ':alarm_clock: Evaluation Time :alarm_clock:',
            `${evaluationTime}ms`,
            false
          )
          .setColor(0x00ff00)
          .build(),
      });
    } catch (e) {
      await message.edit({
        embed: new EmbedBuilder()
          .setTitle('Evaluation Error!')
          .addField(
            ':scroll: Script :scroll:',
            `\`\`\`js\n${script}\n\`\`\``,
            false
          )
          .addField(
            ':no_entry_sign: Error :no_entry_sign:',
            `\`\`\`js\n${e}\n\`\`\``,
            false
          )
          .setColor(0xff0000)
          .build(),
      });
    }
  }

  _redact(script: string) {
    let tokens = [
      this.bot.client.token,
      this.bot.config.databaseUrl,
      this.bot.config.discord.token,
      this.bot.config.redis.host,
      this.bot.config.sentryDSN,
    ];
    if (this.bot.config.botlists) {
      tokens.push(
        ...[
          this.bot.config.botlists.bfdtoken,
          this.bot.config.botlists.blstoken,
          this.bot.config.botlists.topggtoken,
          this.bot.config.botlists.dboatstoken,
        ]
      );
    }
    tokens = tokens.filter(x => !!x);
    const cancellationToken = new RegExp(tokens.join('|'), 'gi');

    return script.replace(cancellationToken, '--snip--');
  }

  // Stolen from: https://github.com/yamdbf/core/blob/master/src/command/base/EvalTS.ts#L68-L96
  compileTypescript(script: string) {
    const file = `${process.cwd()}${require('path').sep}data${
      require('path').sep
    }eval_${Date.now()}.ts`;
    writeFileSync(file, script);
    const program: any = ts.createProgram([file], {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.CommonJS,
      lib: [
        'lib.es2015.d.ts',
        'lib.es2016.d.ts',
        'lib.es2017.d.ts',
        'lib.es2018.d.ts',
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
