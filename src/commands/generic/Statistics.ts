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

    async run(ctx: Context) {
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

                    **Versions**

                    **\`Eris\`**: v${__version__}
                    **\`Nino\`**: v${version}
                    **\`Mongoose\`**: v${mongoose.version}
                    **\`Node\`**: ${process.version}
                    **\`TypeScript\`**: v${ts.version}
                `)
                .build()
        );
    }
}