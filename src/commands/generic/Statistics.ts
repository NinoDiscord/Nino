/* eslint-disable camelcase */

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
import { performance } from 'perf_hooks';

const pkg = require('../../../package.json');

interface RedisInfo {
  total_connections_received: number;
  total_commands_processed: number;
  instantaneous_ops_per_sec: number;
  total_net_input_bytes: number;
  total_net_output_bytes: number;
  instantaneous_input_kbps: number;
  instantaneous_output_kbps: number;
  rejected_connections: number;
  sync_full: number;
  sync_partial_ok: number;
  sync_partial_err: number;
  expired_keys: number;
  expired_stale_perc: number;
  expired_time_cap_reached_count: number;
  evicted_keys: number;
  keyspace_hits: number;
  keyspace_misses: number;
  pubsub_channels: number;
  pubsub_patterns: number;
  latest_fork_usec: number;
  migrate_cached_sockets: number;
  slave_expires_tracked_keys: number;
  active_defrag_hits: number;
  active_defrag_misses: number;
  active_defrag_key_hits: number;
  active_defrag_key_misses: number;
}

interface RedisServerInfo {
  uptime_in_seconds: string;
  process_id: string;
  redis_mode: 'standalone' | 'cluster' | 'sentinel';
}

interface MongoStats {
  uptimeMillis: number;
  pid: number;
  connections: {
    current: number;
    available: number;
    totalCreated: number;
    active: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    numRequests: number;
  }
}

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

    const redis = await this.bot.redis.info('stats');
    const mongo: MongoStats = await this.bot.database.admin.command({ serverStatus: 1 });

    // shhh i stole this from dono
    // credit: https://github.com/FurryBotCo/FurryBot/blob/master/src/commands/information/stats-cmd.ts#L22
    const redisData = redis
      .split(/\n\r?/)
      .slice(1, -1)
      .map((key) => {
        const [k, v] = key.split(':');
        return { [k]: v.trim() };
      }).reduce((first, second) => ({ ...first, ...second }), {}) as unknown as RedisInfo;

    const redisServer = await this.bot.redis.info('server');
    const serverInfo = redisServer.split(/\n\r?/).slice(1, -1).map((value) => {
      const [key, val] = value.split(':');
      return {
        [key]: typeof val === 'string' ? val.trim() : val
      };
    }).reduce((first, second) => ({ ...first, ...second })) as unknown as RedisServerInfo;

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
        connection,
        'redis.connections': redisData.total_connections_received.toLocaleString(),
        'redis.commands': redisData.total_commands_processed.toLocaleString(),
        'redis.operations': redisData.instantaneous_ops_per_sec.toLocaleString(),
        'redis.netIn': formatSize(redisData.total_net_input_bytes),
        'redis.netOut': formatSize(redisData.total_net_output_bytes),
        'redis.uptime': humanize(Number(serverInfo.uptime_in_seconds) * 1000),
        'redis.pid': serverInfo.process_id,
        'redis.type': serverInfo.redis_mode,
        'mongo.connections': mongo.connections.totalCreated.toLocaleString(),
        'mongo.pid': mongo.pid,
        'mongo.uptime': humanize(mongo.uptimeMillis),
        'mongo.netIn': formatSize(mongo.network.bytesIn),
        'mongo.netOut': formatSize(mongo.network.bytesOut),
        'mongo.requests': mongo.network.numRequests.toLocaleString()
      }))
      .build();

    return ctx.embed(embed);
  }
}
