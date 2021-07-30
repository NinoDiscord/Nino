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
import Stopwatch from '../../util/Stopwatch';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import Config from '../../components/Config';
import Redis from '../../components/Redis';
import os from 'os';

export default class StatisticsCommand extends Command {
  private parent!: CommandService;

  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly config!: Config;

  @Inject
  private readonly redis!: Redis;

  constructor() {
    super({
      description: 'descriptions.statistics',
      aliases: ['stats', 'botinfo', 'info', 'me'],
      cooldown: 8,
      name: 'statistics',
    });
  }

  async run(msg: CommandMessage) {
    const database = await this.database.getStatistics();
    const redis = await this.redis.getStatistics();
    const guilds = this.discord.client.guilds.size.toLocaleString();
    const users = this.discord.client.guilds
      .reduce((a, b) => a + b.memberCount, 0)
      .toLocaleString();
    const channels = Object.keys(
      this.discord.client.channelGuildMap
    ).length.toLocaleString();
    const memoryUsage = process.memoryUsage();
    const avgPing = this.discord.client.shards.reduce(
      (a, b) => a + b.latency,
      0
    );
    const node = process.env.REGION ?? 'unknown';
    const ownerIDs = this.config.getProperty('owners') ?? [];
    const owners = await Promise.all(
      ownerIDs.map((id) => {
        const user = this.discord.client.users.get(id);
        if (user === undefined) return this.discord.client.getRESTUser(id);
        else return Promise.resolve(user);
      })
    );

    const dashboardUrl =
      this.discord.client.user.id === '531613242473054229'
        ? 'https://stats.floofy.dev/d/e3KPDLknk/nino-prod?orgId=1'
        : this.discord.client.user.id === '613907896622907425'
          ? 'https://stats.floofy.dev/d/C5bZHVZ7z/nino-edge?orgId=1'
          : '';

    const embed = new EmbedBuilder()
      .setAuthor(
        `[ ${this.discord.client.user.username}#${
          this.discord.client.user.discriminator
        } ~ v${version} (${commitHash ?? '<unknown>'}) ]`,
        'https://nino.floofy.dev',
        this.discord.client.user.dynamicAvatarURL('png', 1024)
      )
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
            `• **Users**\n${users}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: `❯ Process [${process.pid}]`,
          value: [
            `• **System Memory [Free / Total]**\n${formatSize(
              os.freemem()
            )} / ${formatSize(os.totalmem())}`,
            `• **Memory Usage [RSS / Heap]**\n${formatSize(
              memoryUsage.rss
            )} / ${formatSize(memoryUsage.heapUsed)}`,
            `• **Current Node**\n${node ?? 'Unknown'}`,
            `• **Uptime**\n${humanize(
              Math.floor(process.uptime() * 1000),
              true
            )}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: `❯ Redis v${redis.server.redis_version} [${firstUpper(
            redis.server.redis_mode
          )}]`,
          value: [
            `• **Network I/O**\n${formatSize(
              redis.stats.total_net_input_bytes
            )} / ${formatSize(redis.stats.total_net_output_bytes)}`,
            `• **Uptime**\n${humanize(
              Number(redis.server.uptime_in_seconds) * 1000,
              true
            )}`,
            `• **Ops/s**\n${redis.stats.instantaneous_ops_per_sec.toLocaleString()}`,
            `• **Ping**\n${redis.ping}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: `❯ PostgreSQL v${database.version}`,
          value: [
            `• **Insert / Delete / Update / Fetched**:\n${database.inserted.toLocaleString()} / ${database.deleted.toLocaleString()} / ${database.updated.toLocaleString()} / ${database.fetched.toLocaleString()}`,
            `• **Uptime**\n${database.uptime}`,
            `• **Ping**\n${database.ping}`,
          ].join('\n'),
          inline: true,
        },
      ])
      .setFooter(
        `Owners: ${owners
          .map((user) => `${user.username}#${user.discriminator}`)
          .join(', ')}`
      );

    if (dashboardUrl !== '')
      embed.setDescription(`[[**Metrics Dashboard**]](${dashboardUrl})`);

    return msg.reply(embed);
  }
}
