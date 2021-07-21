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

import type { Guild, TextChannel } from 'eris';
import { Inject, Subscribe } from '@augu/lilith';
import { EmbedBuilder } from '../structures';
import BotlistsService from '../services/BotlistService';
import { Logger } from 'tslog';
import Database from '../components/Database';
import Discord from '../components/Discord';
import Config from '../components/Config';
import Prom from '../components/Prometheus';

export default class VoidListener {
  @Inject
  private readonly prometheus?: Prom;

  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly botlists?: BotlistsService;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly config!: Config;

  @Subscribe('guildCreate', { emitter: 'discord' })
  async onGuildCreate(guild: Guild) {
    if (guild.name === undefined)
      return;

    this.logger.info(`✔ New Guild: ${guild.name} (${guild.id})`);
    await this.database.guilds.create(guild.id);
    this.prometheus?.guildCount?.inc();
    await this.botlists?.post();

    const channel = this.discord.client.getChannel('844410521599737878') as TextChannel;
    const owner = this.discord.client.users.get(guild.ownerID);
    const bots = guild.members.filter(r => r.bot).length;
    const humans = guild.members.filter(r => !r.bot).length;

    const prefixes = this.config.getProperty('prefixes') ?? ['x!'];
    const statusType = this.config.getProperty('status.type');
    const status = this.config.getProperty('status.status')!;

    for (const shard of this.discord.client.shards.values()) {
      this.discord.client.editStatus(this.config.getProperty('status.presence') ?? 'online', {
        name: status
          .replace('$prefix$', prefixes[Math.floor(Math.random() * prefixes.length)])
          .replace('$guilds$', this.discord.client.guilds.size.toLocaleString())
          .replace('$shard$', `#${shard.id}`),

        type: statusType ?? 0
      });
    }

    if (channel !== undefined && channel.type === 0) {
      const embed = EmbedBuilder.create()
        .setAuthor(`[ Joined ${guild.name} (${guild.id}) ]`, undefined, this.discord.client.user.dynamicAvatarURL('png', 1024))
        .setDescription([
          `• **Members [Bots / Total]**: ${humans.toLocaleString()} members with ${bots} bots (large?: ${guild.large ? 'Yes' : 'No'})`,
          `• **Owner**: ${owner ? `${owner.username}#${owner.discriminator} (${owner.id})` : 'Not cached'}`
        ])
        .setFooter(`✔ Now at ${this.discord.client.guilds.size.toLocaleString()} Guilds`);

      return channel.createMessage({ embed: embed.build() });
    }
  }

  @Subscribe('guildDelete', { emitter: 'discord' })
  async onGuildDelete(guild: Guild) {
    if (guild.name === undefined)
      return;

    this.logger.info(`❌ Left Guild: ${guild.name} (${guild.id})`);
    await this.database.guilds.delete(guild.id);
    this.prometheus?.guildCount?.dec();
    await this.botlists?.post();

    const channel = this.discord.client.getChannel('844410521599737878') as TextChannel;
    const owner = this.discord.client.users.get(guild.ownerID);
    const bots = guild.members.filter(r => r.bot).length;
    const humans = guild.members.filter(r => !r.bot).length;

    const prefixes = this.config.getProperty('prefixes') ?? ['x!'];
    const statusType = this.config.getProperty('status.type');
    const status = this.config.getProperty('status.status')!;

    for (const shard of this.discord.client.shards.values()) {
      this.discord.client.editStatus(this.config.getProperty('status.presence') ?? 'online', {
        name: status
          .replace('$prefix$', prefixes[Math.floor(Math.random() * prefixes.length)])
          .replace('$guilds$', this.discord.client.guilds.size.toLocaleString())
          .replace('$shard$', `#${shard.id}`),

        type: statusType ?? 0
      });
    }

    if (channel !== undefined && channel.type === 0) {
      const embed = EmbedBuilder.create()
        .setAuthor(`[ Left ${guild.name} (${guild.id}) ]`, undefined, this.discord.client.user.dynamicAvatarURL('png', 1024))
        .setDescription([
          `• **Members [Bots / Total]**: ${humans.toLocaleString()} members with ${bots} bots (large?: ${guild.large ? 'Yes' : 'No'})`,
          `• **Owner**: ${owner ? `${owner.username}#${owner.discriminator} (${owner.id})` : 'Not cached'}`
        ])
        .setFooter(`✔ Now at ${this.discord.client.guilds.size.toLocaleString()} Guilds`);

      return channel.createMessage({ embed: embed.build() });
    }
  }
}
