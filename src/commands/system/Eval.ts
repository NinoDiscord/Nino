import { stripIndents } from 'common-tags';
import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import ts from 'typescript';

export default class EvalCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'eval',
            description: 'Evaluates JavaScript or TypeScript code and return a clean output',
            usage: '[--ts] <script>',
            aliases: ['js', 'evl'],
            category: 'System Adminstration',
            ownerOnly: true
        });
    }

    async run(ctx: Context) {
        const ts = ctx.flags.get('ts');

        // idk why would u do this but ok then
        if (typeof ts === 'string') return ctx.send('Sorry but you must only add `--ts`, not `--ts=<script>`');

        if (ts) {
            ctx.args.args.pop();
            this.typescript(ctx);
        } else {
            this.javascript(ctx);
        }
    }

    async javascript(ctx: Context) {

    }

    async typescript(ctx: Context) {
        if (ctx.args.has(0)) return ctx.send('You must provide the `<script>` argument.');

        const startedAt = Date.now();
        const script    = ctx.args.join('');

        try {
            let result = ts.transpileModule(script, {
                compilerOptions: {
                    target: ts.ScriptTarget.ESNext,
                    module: ts.ModuleKind.CommonJS,
                    lib: ["es2015", "es2016", "esnext"]
                }
            });
            let response = JSON.stringify(result);
            response = this.redact();

            ctx.embed(
                this
                    .client
                    .getEmbed()
                    .setTitle('TypeScript Evaluation')
                    .setDescription(stripIndents`
                        **Input**:
                        \`\`\`ts
                        ${script}
                        \`\`\`

                        **Output**:
                        \`\`\`ts
                        ${response}
                        \`\`\`
                    `)
                    .setFooter(`Time Alotted: ${Date.now() - startedAt}`, ctx.sender.avatarURL)
                    .build()
            );
        } catch(ex) {

        }
    }

    redact() {
        
    }
}