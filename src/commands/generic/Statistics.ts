import { VERSION as __version__ } from 'eris';
import { stripIndents } from 'common-tags';
import { humanize } from '../../util';
import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import { execSync } from 'child_process';

export default class StatisticsCommand extends Command {
    constructor(client: Bot) {
        super(client, {
            name: 'statistics',
            description: 'Gives you the bot\'s statistics',
            aliases: [ 'stats', 'info', 'bot', 'botinfo' ],
            category: 'Generic',
            ownerOnly: false
        });
    }

    getMostUsedCommand() {
        if (Object.keys(this.bot.stats.commandUsage).length > 0) {
            const name = Object.keys(this.bot.stats.commandUsage)
            .map(key => ({ key, uses: this.bot.stats.commandUsage[key].size })) // map key array to {key uses} array
            .sort((a, b) => b.uses - a.uses) // Sort by uses
            [0].key;

            return {
                command: name,
                size: this.bot.stats.commandUsage[name].size,
                users: this.bot.stats.commandUsage[name].users.length
            };  
        }
        return {command: 'None', size: 0, users: 0};
    }

    async run(ctx: Context) {
        const command = this.getMostUsedCommand();
        const build   = await this.bot.database.getBuild();
        const commit  = execSync('git rev-parse HEAD').toString().trim();
        
        return ctx.send(stripIndents`
            \`\`\`prolog
            Guilds              ~> ${this.bot.client.guilds.size.toLocaleString()}
            Users               ~> ${this.bot.client.users.size.toLocaleString()}
            Channels            ~> ${Object.keys(this.bot.client.channelGuildMap).length.toLocaleString()}
            Shards [C/T]        ~> [${ctx.guild.shard.id}/${this.bot.client.shards.size}]
            Uptime              ~> ${humanize(Date.now() - this.bot.client.startTime)}
            Commands            ~> ${this.bot.manager.commands.size}
            Messages Seen       ~> ${this.bot.stats.messagesSeen.toLocaleString()}
            Commands Executed   ~> ${this.bot.stats.commandsExecuted.toLocaleString()}
            Most Used Command   ~> ${command.command} (${command.size} executions)
            Database Connection ~> v${build.version}
            GitHub Commit       ~> ${commit.slice(0, 7)}
            \`\`\`
        `);
    }
}