import { humanize, formatSize, commitHash } from '../../util';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import sys from '@augu/sysinfo';

const pkg = require('../../../package.json');

@injectable()
export default class StatisticsCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'statistics',
      description: 'Gives you the bot\'s statistics',
      aliases: ['stats', 'info', 'bot', 'botinfo']
    });
  }

  async run(ctx: Context) {
    const { command, uses } = this.bot.statistics.getCommandUsages();
    const users = this.bot.client.guilds.reduce((a, b) => a + b.memberCount, 0).toLocaleString();
    const channels = Object.keys(this.bot.client.channelGuildMap).length;
    const shardPing = this.bot.client.shards.reduce((a, b) => a + b.latency, 0);
    const connection = await this.bot.database.admin.ping();
    const memoryUsage = formatSize(process.memoryUsage().rss);

    const embed = this.bot.getEmbed()
      .setAuthor(ctx.translate('commands.generic.statistics.title', { 
        username: `${this.bot.client.user.username}#${this.bot.client.user.discriminator}`,
        version: `v${pkg.version} | ${commitHash}`
      }), 'https://nino.augu.dev', this.bot.client.user.dynamicAvatarURL('png', 1024))
      .setDescription(ctx.translate('commands.generic.statistics.description', {
        guilds: this.bot.client.guilds.size.toLocaleString(),
        users,
        channels,
        'shards.current': ctx.guild ? ctx.guild.shard.id : 0,
        'shards.alive': this.bot.client.shards.filter(s => s.status === 'ready').length,
        'shards.total': this.bot.client.shards.size,
        'shards.dead': this.bot.client.shards.filter(s => s.status === 'disconnected').length,
        'shards.latency': shardPing,
        uptime: humanize(Math.round(process.uptime()) * 1000),
        commands: this.bot.manager.commands.size,
        messagesSeen: this.bot.statistics.messagesSeen.toLocaleString(),
        commandsExecuted: this.bot.statistics.commandsExecuted.toLocaleString(),
        'mostUsed.command': command,
        'mostUsed.executed': uses,
        'memory.rss': memoryUsage,
        'memory.heap': formatSize(process.memoryUsage().heapUsed),
        'sys.os': sys.getPlatform(),
        'sys.cpu': sys.getCPUUsage(),
        connection
      }))
      .build();

    return ctx.embed(embed);
  }
}
