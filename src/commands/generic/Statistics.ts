import { VERSION as __version__ } from 'eris';
import { stripIndents } from 'common-tags';
import { humanize } from '../../util';
import NinoClient from '../../structures/Client';
import mongoose from 'mongoose';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import ts from 'typescript';

const version: string = require('../../../package').version;

export default class StatisticsCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'statistics',
            description: 'Gives you the bot\'s statistics',
            aliases: ['stats'],
            category: 'Generic',
            ownerOnly: false
        });
    }

    getMostUsedCommand() {
        const name = Object.keys(this.client.stats.commandUsage).sort((a, b) => {
            if (a < b) return 1;
            if (a > b) return -1;
            return 0;
        })[0];

        return {
            command: name,
            size: this.client.stats.commandUsage[name].size,
            users: this.client.stats.commandUsage[name].users.length
        }
    }

    async run(ctx: Context) {
        const mostUsed = this.getMostUsedCommand();
        return ctx.embed(
            this
                .client
                .getEmbed()
                .setTitle(`${this.client.user.username}#${this.client.user.discriminator} | Realtime Statistics`)
                .setDescription(stripIndents`
                    **General**

                    **\`Guilds\`**: ${this.client.guilds.size.toLocaleString()}
                    **\`Users\`**: ${this.client.users.size.toLocaleString()}
                    **\`Channels\`**: ${Object.keys(this.client.channelGuildMap).length.toLocaleString()}
                    **\`Shards\`**: ${this.client.shards.size}
                    **\`Uptime\`**: ${humanize(Date.now() - this.client.startTime)}
                    **\`Commands\`**: ${this.client.manager.commands.size}

                    **Versions**

                    **\`Eris\`**: v${__version__}
                    **\`Nino\`**: v${version}
                    **\`Mongoose\`**: v${mongoose.version}
                    **\`Node\`**: ${process.version}
                    **\`TypeScript\`**: v${ts.version}

                    **Other**

                    **\`Messages Seen\`**: ${this.client.stats.messagesSeen.toLocaleString()}
                    **\`Commands Executed\`**: ${this.client.stats.commandsExecuted.toLocaleString()}
                    **\`Most Used Command\`**: ${mostUsed.command} (${mostUsed.size} executions; ${mostUsed.users} users)
                `)
                .build()
        );
    }
}