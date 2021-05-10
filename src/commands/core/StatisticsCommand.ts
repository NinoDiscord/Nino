/**
 * Copyright (c) 2019-2021 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* eslint-disable camelcase */

import { Command, CommandMessage, EmbedBuilder } from '../../structures';
import { Color, version, commitHash } from '../../util/Constants';
import { firstUpper, humanize } from '@augu/utils';
import CommandService from '../../services/CommandService';
import { formatSize } from '../../util';
import { Inject } from '@augu/lilith';
import Kubernetes from '../../components/Kubernetes';
import Stopwatch from '../../util/Stopwatch';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import Config from '../../components/Config';
import Redis from '../../components/Redis';
import os from 'os';

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
  redis_version: string;
  redis_git_sha1: string;
  redis_git_dirty: string;
  redis_build_id: string;
  redis_mode: string;
  os: string;
  arch_bits: string;
  multiplexing_api: string;
  atomicvar_api: string;
  gcc_version: string;
  process_id: string;
  process_supervised: string;
  run_id: string;
  tcp_port: string;
  server_time_usec: string;
  uptime_in_seconds: string;
  uptime_in_days: string;
  hz: string;
  configured_hz: string;
  lru_clock: string;
  executable: string;
  config_file: string;
  io_threads_active: string;
}

export default class StatisticsCommand extends Command {
  private parent!: CommandService;

  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  @Inject
  private config!: Config;

  @Inject
  private redis!: Redis;

  @Inject
  private k8s!: Kubernetes;

  constructor() {
    super({
      description: 'descriptions.statistics',
      aliases: ['stats', 'botinfo', 'info', 'me'],
      cooldown: 8,
      name: 'statistics'
    });
  }

  private async getRedisInfo() {
    const stopwatch = new Stopwatch();
    stopwatch.start();
    await this.redis.client.ping('Ice is cute as FUCK');

    const ping = stopwatch.end();

    // stole this from donny
    // Credit: https://github.com/FurryBotCo/FurryBot/blob/master/src/commands/information/stats-cmd.ts#L22
    const stats = await this.redis.client.info('stats').then(info =>
      info
        .split(/\n\r?/)
        .slice(1, -1)
        .map(item => ({ [item.split(':')[0]]: item.split(':')[1].trim() }))
        .reduce((a, b) => ({ ...a, ...b })) as unknown as RedisInfo
    );

    const server = await this.redis.client.info('server').then(info =>
      info
        .split(/\n\r?/)
        .slice(1, -1)
        .map(item => ({ [item.split(':')[0]]: item.split(':')[1].trim() }))
        .reduce((a, b) => ({ ...a, ...b })) as unknown as RedisServerInfo
    );

    return {
      server,
      stats,
      ping
    };
  }

  async getDatabaseStatistics() {
    const stopwatch = new Stopwatch();
    stopwatch.start();
    await this.database.connection.query('SELECT * FROM guilds');
    const ping = stopwatch.end();

    // collect shit
    const data = await Promise.all([
      this.database.connection.query('SELECT tup_returned, tup_fetched, tup_inserted, tup_updated, tup_deleted FROM pg_stat_database WHERE datname = \'nino\';'),
      this.database.connection.query('SELECT version();'),
      this.database.connection.query('SELECT extract(epoch FROM current_timestamp - pg_postmaster_start_time()) AS uptime;')
    ]);

    return {
      inserted: Number(data[0][0].tup_inserted),
      updated: Number(data[0][0].tup_updated),
      deleted: Number(data[0][0].tup_deleted),
      fetched: Number(data[0][0].tup_fetched),
      version: data[1][0].version.split(', ').shift().replace('PostgreSQL ', '').trim(),
      uptime: humanize(Math.floor(data[2][0].uptime * 1000), true),
      ping
    };
  }

  async run(msg: CommandMessage) {
    const database = await this.getDatabaseStatistics();
    const redis = await this.getRedisInfo();
    const guilds = this.discord.client.guilds.size.toLocaleString();
    const users = this.discord.client.guilds.reduce((a, b) => a + b.memberCount, 0).toLocaleString();
    const channels = Object.keys(this.discord.client.channelGuildMap).length.toLocaleString();
    const memoryUsage = process.memoryUsage();
    const avgPing = this.discord.client.shards.reduce((a, b) => a + b.latency, 0);
    const node = await this.k8s.getCurrentNode();
    const ownerIDs = this.config.getProperty('owners') ?? [];
    const owners = await Promise.all(ownerIDs.map(id => {
      const user = this.discord.client.users.get(id);
      if (user === undefined)
        return this.discord.client.getRESTUser(id);
      else
        return Promise.resolve(user);
    }));

    const embed = new EmbedBuilder()
      .setAuthor(`[ ${this.discord.client.user.username}#${this.discord.client.user.discriminator} ~ v${version} (${commitHash ?? '<unknown>'}) ]`, 'https://nino.floofy.dev', this.discord.client.user.dynamicAvatarURL('png', 1024))
      .setColor(Color)
      .addFields([
        {
          name: '❯ Discord',
          value: [
            `• **Commands Executed (session)**\n${this.parent.commandsExecuted.toLocaleString()}`,
            `• **Messages Seen (session)**\n${this.parent.messagesSeen.toLocaleString()}`,
            `• **Shards [C / T]**\n${msg.guild.shard.id} / ${this.discord.client.shards.size} (${avgPing}ms avg.)`,
            `• **Channels**\n${channels}`,
            `• **Guilds**\n${guilds}`,
            `• **Users**\n${users}`
          ].join('\n'),
          inline: true
        },
        {
          name: `❯ Process [${process.pid}]`,
          value: [
            `• **System Memory [Free / Total]**\n${formatSize(os.freemem())} / ${formatSize(os.totalmem())}`,
            `• **Memory Usage [RSS / Heap]**\n${formatSize(memoryUsage.rss)} / ${formatSize(memoryUsage.heapUsed)}`,
            `• **Current Node**\n${node ?? 'Unknown'}`,
            `• **Uptime**\n${humanize(Math.floor(process.uptime() * 1000), true)}`
          ].join('\n'),
          inline: true
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true
        },
        {
          name: `❯ Redis v${redis.server.redis_version} [${firstUpper(redis.server.redis_mode)}]`,
          value: [
            `• **Network I/O**\n${formatSize(redis.stats.total_net_input_bytes)} / ${formatSize(redis.stats.total_net_output_bytes)}`,
            `• **Uptime**\n${humanize(Number(redis.server.uptime_in_seconds) * 1000, true)}`,
            `• **Ops/s**\n${redis.stats.instantaneous_ops_per_sec.toLocaleString()}`,
            `• **Ping**\n${redis.ping}`
          ].join('\n'),
          inline: true
        },
        {
          name: `❯ PostgreSQL v${database.version}`,
          value: [
            `• **Insert / Delete / Update / Fetched**:\n${database.inserted.toLocaleString()} / ${database.deleted.toLocaleString()} / ${database.updated.toLocaleString()} / ${database.fetched.toLocaleString()}`,
            `• **Uptime**\n${database.uptime}`,
            `• **Ping**\n${database.ping}`
          ].join('\n'),
          inline: true
        }
      ])
      .setFooter(`Owners: ${owners.map((user) => `${user.username}#${user.discriminator}`).join(', ')}`);

    return msg.reply(embed);
  }
}
