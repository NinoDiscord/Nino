import { VERSION as version } from 'eris';
import { stripIndents } from 'common-tags';
import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import ms = require('ms');

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
                    **\`Uptime\`**: ${ms((Date.now() - this.client.startTime) * 1000, { long: true })}
                `)
                .build()
        );
    }
}