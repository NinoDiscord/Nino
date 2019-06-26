import { stripIndents } from 'common-tags';
import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class EvalCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'eval',
            description: 'Evaluates JavaScript code and return a clean output',
            usage: '<script>',
            aliases: [ 'js', 'evl' ],
            category: 'System Adminstration',
            ownerOnly: true
        });
    }

    async run(ctx: Context) {
        
    }
}