import { VERSION as version } from 'eris';
import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { humanize } from '../../util';
import { execSync } from 'child_process';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import ts from 'typescript';

const pkg = require('../../../package.json');

@injectable()
export default class StatisticsCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'statistics',
      description: 'Gives you the bot\'s statistics',
      aliases: ['stats', 'info', 'bot', 'botinfo'],
      category: 'Generic',
      ownerOnly: false,
    });
  }

  async run(ctx: Context) {
    const { command, size: uses } = this.bot.statistics.getCommandUsages();
    const build = await this.bot.database.getBuild();
    const commit = execSync('git rev-parse HEAD').toString().trim();
    const users = this.bot.client.guilds.reduce((a, b) => a + b.memberCount, 0);
    const channels = Object.keys(this.bot.client.channelGuildMap).length;
    const shardPing = this.bot.client.shards.reduce((a, b) => a + b.latency, 0);
    const connection = await this.bot.database.admin.ping();

    const embed = this.bot.getEmbed()
      .setTitle(`${this.bot.client.user.username}#${this.bot.client.user.discriminator} | Realtime Statistics`)
      .setDescription(stripIndents`
        \`\`\`prolog
        Guilds              ~> ${this.bot.client.guilds.size.toLocaleString()}
        Users               ~> ${users.toLocaleString()}
        Channels            ~> ${channels.toLocaleString()}
        Shards              ~> ${ctx.guild!.shard.id}/${this.bot.client.shards.size} (${shardPing}ms avg.)
        Uptime              ~> ${humanize(Date.now() - this.bot.client.startTime)}
        Total Commands      ~> ${this.bot.manager.commands.size}
        Messages Seen       ~> ${this.bot.statistics.messagesSeen.toLocaleString()}
        Commands Executed   ~> ${this.bot.statistics.commandsExecuted.toLocaleString()}
        Most Used Command   ~> ${command} (${uses} executions)
        MongoDB Version     ~> v${build.version}
        TypeScript Version  ~> v${ts.version}
        Node.js Version     ~> ${process.version}
        Eris Version        ~> ${version}
        Nino Version        ~> ${pkg.version} (${commit.slice(0, 7)})
        Database Connection ~> ${connection.ok === 1 ? 'Online' : 'Offline'}
        \`\`\`
      `)
      .build();

    return ctx.embed(embed);
  }
}
