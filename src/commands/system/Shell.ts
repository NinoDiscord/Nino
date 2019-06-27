import { stripIndents } from 'common-tags';
import { execSync } from 'child_process';
import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class ShellCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'shell',
            description: 'Runs a command on the bot\'s host machine.',
            usage: '<script>',
            aliases: [ 'exec', 'sh' ],
            category: 'System Adminstration',
            ownerOnly: true
        });
    }

    async run(ctx: Context) {
        
    }
}