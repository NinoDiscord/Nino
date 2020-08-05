import { humanize, formatSize, commitHash } from '../../util';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import sys from '@augu/sysinfo';
import { Client } from 'eris';
import CommandStatisticsManager from '../../structures/managers/CommandStatisticsManager';
import DatabaseManager from '../../structures/managers/DatabaseManager';
import { createEmptyEmbed } from '../../util/EmbedUtils';
import CommandManager from '../../structures/managers/CommandManager';
import { lazyInject } from '../../inversify.config';

const pkg = require('../../../package.json');

@injectable()
export default class StatisticsCommand extends Command {
  @lazyInject(TYPES.CommandManager)
  private commandManager!: CommandManager;

  constructor(
    @inject(TYPES.Bot) bot: Bot,
    @inject(TYPES.Client) private client: Client,
    @inject(TYPES.CommandStatisticsManager) private commandStatisticsManager: CommandStatisticsManager,
    @inject(TYPES.DatabaseManager) private databaseManager: DatabaseManager
  ) {
    super(bot, {
      name: 'statistics',
      description: 'Gives you the bot\'s statistics',
      aliases: ['stats', 'info', 'bot', 'botinfo']
    });
  }

  async run(ctx: Context) {
    const { command, uses } = this.commandStatisticsManager.getCommandUsages();
    const guilds = this.client.guilds;
    const shards = this.client.shards;
    const users = guilds.reduce((a, b) => a + b.memberCount, 0).toLocaleString();
    const channels = Object.keys(this.client.channelGuildMap).length;
    const shardPing = shards.reduce((a, b) => a + b.latency, 0);
    const connection = await this.databaseManager.admin.ping();
    const memoryUsage = formatSize(process.memoryUsage().rss);
    const botUser = this.client.user;

    const embed = createEmptyEmbed()
      .setAuthor(ctx.translate('commands.generic.statistics.title', { 
        username: `${botUser.username}#${botUser.discriminator}`,
        version: `v${pkg.version} / ${commitHash}`
      }), 'https://nino.augu.dev', botUser.dynamicAvatarURL('png', 1024))
      .setDescription(ctx.translate('commands.generic.statistics.description', {
        guilds: guilds.size.toLocaleString(),
        users,
        channels,
        'shards.alive': shards.filter(s => s.status === 'ready').length,
        'shards.total': shards.size,
        'shards.latency': shardPing,
        uptime: humanize(Math.round(process.uptime()) * 1000),
        commands: this.commandManager.commands.size,
        messagesSeen: this.commandStatisticsManager.messagesSeen.toLocaleString(),
        commandsExecuted: this.commandStatisticsManager.commandsExecuted.toLocaleString(),
        'mostUsed.command': command,
        'mostUsed.executed': uses,
        'memory.rss': memoryUsage,
        'memory.heap': formatSize(process.memoryUsage().heapUsed),
        'sys.os': sys.getPlatform(),
        'sys.cpu': sys.getCPUUsage(),
        'sys.free': formatSize(sys.getFreeMemory()),
        'sys.total': formatSize(sys.getTotalMemory()),
        connection
      }))
      .build();

    return ctx.embed(embed);
  }
}
