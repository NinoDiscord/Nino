import { stripIndents } from 'common-tags';
import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import EmbedBuilder from '../../structures/EmbedBuilder';
import ts from 'typescript';
import fs from 'fs';

class CompilerError extends Error {
    constructor(m: string) {
        super(m);

        this.name = 'CompilerError';
    }
}

export default class EvalCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'eval',
            description: 'Evaluates JavaScript code and return a clean output',
            usage: '<script>',
            aliases: [ 'js', 'evl' ],
            category: 'System Adminstration',
            ownerOnly: true,
            hidden: true
        });
    }

    async run(ctx: Context) {
        const message = await ctx.embed(new EmbedBuilder().setTitle('Evaluating...').setColor(0x00ff00).build());
        const script = ctx.args.join(' ');
        const startTime = Date.now();
        let result;

        const typescript = ctx.flags.get('ts');
        if (typeof typescript === 'string') return ctx.send('Um, I\'m sorry but it\'s just `--ts`');

        try {
            if (typescript) result = this.compileTypescript(script);
            result = eval(script);
            const evaluationTime = Date.now() - startTime;
            await message.edit({
                embed: new EmbedBuilder()
                    .setTitle('Evauluation')
                    .addField(":scroll: Script :scroll:", `\`\`\`js\n${script}\n\`\`\``, false)
                    .addField(":white_check_mark: Result :white_check_mark:", `\`\`\`js\n${result}\n\`\`\``, false)
                    .addField(":alarm_clock: Evaluation Time :alarm_clock:", `${evaluationTime}ms`, false)
                    .setColor(0x00ff00)
                    .build()
            });
        } catch (e) {
            await message.edit({
                embed: new EmbedBuilder()
                    .setTitle('Evaluation Error!')
                    .addField(":scroll: Script :scroll:", `\`\`\`js\n${script}\n\`\`\``, false)
                    .addField(":no_entry_sign: Error :no_entry_sign:", `\`\`\`js\n${e}\n\`\`\``, false)
                    .setColor(0xff0000)
                    .build()
            });
        }
    }

    // Stolen from: https://github.com/yamdbf/core/blob/master/src/command/base/EvalTS.ts#L68-L96
    compileTypescript(script: string) {
        let message!: string;
        const file = `${process.cwd()}${require('path').sep}data${require('path').sep}eval_${Date.now()}.ts`;
        fs.writeFileSync(file, script);
        const program: any = ts.createProgram([file], {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            lib: ['es2015', 'es2016', 'es2017', 'es2018', 'esnext'],
            declaration: false,
            strict: true,
            noImplicitAny: true,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            experimentalDecorators: true,
            emitDeclarationMetadata: true
        });

        let diagnostics: (readonly any[]) = ts.getPreEmitDiagnostics(program);
        if (diagnostics.length > 0) {
            diagnostics = diagnostics.map((data) => {
                const txt = ts.flattenDiagnosticMessageText(data.messageText, '\n');
                const d = data.file!.getLineAndCharacterOfPosition(data.start!);
                return `\n[${d.line + 1};${d.character + 1}]: ${txt} (${data.code})`;
            }).filter(d => !d.includes('Cannot find name'));
            if (diagnostics.length > 0) message = diagnostics.join('');
        }

        fs.unlinkSync(file);
        if (message) throw new CompilerError(message);

        return ts.transpileModule(script, {
            compilerOptions: {
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.CommonJS,
                lib: ['es2015', 'es2016', 'es2017', 'es2018', 'esnext'],
                declaration: false,
                strict: true,
                noImplicitAny: true,
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                experimentalDecorators: true,
                emitDeclarationMetadata: true
            }
        }).outputText;
    }
}