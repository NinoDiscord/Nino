import { humanize, formatSize } from '../../util';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class StatisticsCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'statistics',
      description: 'Gives you the bot\'s statistics',
      aliases: ['stats', 'info', 'bot', 'botinfo'],
      category: 'Generic'
    });
  }

  async run(ctx: Context) {
    const locale = await ctx.getLocale();
    const { command, uses } = this.bot.statistics.getCommandUsages();
    const users = this.bot.client.guilds.reduce((a, b) => a + b.memberCount, 0).toLocaleString();
    const channels = Object.keys(this.bot.client.channelGuildMap).length;
    const shardPing = this.bot.client.shards.reduce((a, b) => a + b.latency, 0);
    const connection = await this.bot.database.admin.ping();
    const memoryUsage = formatSize(process.memoryUsage().heapUsed);

    const embed = this.bot.getEmbed()
      .setTitle(locale.translate('commands.generic.statistics.title', { username: `${this.bot.client.user.username}#${this.bot.client.user.discriminator}` }))
      .setDescription(locale.translate('commands.generic.statistics.description', {
        guilds: this.bot.client.guilds.size.toLocaleString(),
        users,
        channels,
        current: ctx.guild ? ctx.guild.shard.id : 0,
        total: this.bot.client.shards.size,
        latency: shardPing,
        uptime: humanize(Math.round(process.uptime()) * 1000),
        commands: this.bot.manager.commands.size,
        messages: this.bot.statistics.messagesSeen.toLocaleString(),
        executed: this.bot.statistics.commandsExecuted.toLocaleString(),
        name: command,
        executions: uses,
        connected: connection.ok === 1 ? locale.translate('global.online') : locale.translate('global.offline'),
        memoryUsage
      }))
      .build();

    return ctx.embed(embed);
  }
}