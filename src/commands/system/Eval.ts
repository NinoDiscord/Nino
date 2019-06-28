import { stripIndents } from 'common-tags';
import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import EmbedBuilder from '../../structures/EmbedBuilder';

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
        try {
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
}