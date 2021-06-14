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

import { Constants, Guild, Message, TextChannel, Overwrite } from 'eris';
import { PunishmentType } from '../entities/PunishmentsEntity';
import PunishmentService from '../services/PunishmentService';
import PermissionUtil from '../util/Permissions';
import { isObject } from '@augu/utils';
import { Automod } from '../structures';
import * as luxon from 'luxon';
import { Inject } from '@augu/lilith';
import Database from '../components/Database';
import Discord from '../components/Discord';
import Redis from '../components/Redis';

interface RaidChannelLock {
  affectedIn: string;
  state: {
    channelID: string;
    position: RaidChannelLockPositionArray[];
  }[];
}

interface RaidChannelLockPositionArray {
  allow: bigint;
  deny: bigint;
  type: Overwrite['type'];
  id: string;
}

interface IBigIntSerialized {
  value: number;
  bigint: boolean;
}

// Serializer for JSON.stringify for bigints
const bigintSerializer = (_: string, value: unknown) => {
  if (typeof value === 'bigint')
    return { value: Number(value), bigint: true };
  else
    return value;
};

// Deserializer for JSON.parse for bigints
const bigintDeserializer = (_: string, value: unknown) => {
  if (isObject<IBigIntSerialized>(value) && value.bigint === true)
    return BigInt(value.value);
  else
    return value;
};

export default class RaidAutomod implements Automod {
  protected _raidLocks: Record<string, NodeJS.Timeout> = {};
  public name = 'raid';

  @Inject
  private readonly punishments!: PunishmentService;

  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly redis!: Redis;

  async onMessage(msg: Message<TextChannel>) {
    const settings = await this.database.automod.get(msg.guildID);

    if (settings === undefined || settings.raid === false)
      return false;

    if (!msg || msg === null)
      return false;

    const nino = msg.channel.guild.members.get(this.discord.client.user.id)!;

    if (
      msg.member !== null &&
      !PermissionUtil.isMemberAbove(nino, msg.member) ||
      !msg.channel.permissionsOf(this.discord.client.user.id).has('manageMessages') ||
      msg.author.bot ||
      msg.channel.permissionsOf(msg.author.id).has('banMembers')
    ) return false;

    // A raid can happen with 25-100+ pings
    const joinedAt = luxon.DateTime.fromJSDate(new Date(msg.member.joinedAt));
    const now = luxon.DateTime.now();
    const difference = Math.floor(now.diff(joinedAt, ['days']).days);
    if (msg.mentions.length > 20 && difference < 3) {
      // Lockdown all channels @everyone has access in
      await this._lockChannels(msg.channel.id, msg.channel.guild);
      await msg.channel.createMessage([
        ':lock: A raid is occuring, so I lock down all channels everyone has **\`Send Messages\`** in.',
        'Channels be restored in 10 seconds, so prepare for yourself!'
      ].join('\n'));

      await this.punishments.apply({
        moderator: this.discord.client.user,
        publish: true,
        reason: `[Automod] Raid in <#${msg.channel.id}> (Pinged ${msg.mentions.length} users)`,
        member: {
          guild: msg.channel.guild,
          id: msg.author.id
        },
        soft: false,
        type: PunishmentType.Ban
      });

      await this._restore(msg.channel.guild);
      await msg.channel.createMessage(':thumbsup: Permissions have been restored, sorry if you got pinged!');

      return true;
    }

    return false;
  }

  protected async _lockChannels(affectedID: string, guild: Guild) {
    // Retrieve old permissions
    const state = guild.channels.map(channel => ({
      channelID: channel.id,
      position: channel.permissionOverwrites
        .filter(overwrite => overwrite.type === 'role' && overwrite.id !== guild.id)
        .map(overwrite => ({
          allow: overwrite.allow,
          deny: overwrite.deny,
          type: overwrite.type,
          id: overwrite.id
        }))
    }));

    await this.redis.client.hset('nino:raid:lockdowns:channels', guild.id, JSON.stringify({ affectedIn: affectedID, state }, bigintSerializer));

    // Change @everyone's permissions in all text channels
    for (const channel of guild.channels.filter<TextChannel>(channel => channel.type === 0)) {
      const allow = channel.permissionOverwrites.has(guild.id) ? channel.permissionOverwrites.get(guild.id)!.allow : 0n;
      const deny = channel.permissionOverwrites.has(guild.id) ? channel.permissionOverwrites.get(guild.id)!.deny : 0n;

      // this shouldn't happen but whatever
      // Checks if `deny` can be shifted with `sendMessages`
      if (!!(deny & Constants.Permissions.sendMessages) === true)
        continue;

      await channel.editPermission(
        /* role id */ guild.id,
        /* allowed */ allow & ~Constants.Permissions.sendMessages,
        /* denied */ deny | Constants.Permissions.sendMessages,
        /* type */ 'role',
        /* reason */ '[Lockdown] Raid occured.'
      );
    }
  }

  protected async _restore(guild: Guild) {
    const locks = await this.redis.client.hget('nino:raid:lockdowns:channels', guild.id)
      .then(data => data !== null ? JSON.parse<RaidChannelLock>(data, bigintDeserializer) : null)
      .catch(() => null);

    if (locks !== null) {
      const channel = guild.channels.get<TextChannel>(locks.affectedIn);
      if (channel !== undefined && channel.type === 0) {
        const overwrite = channel.permissionOverwrites.get(guild.id);
        await channel.editPermission(
          guild.id,
          overwrite?.allow ?? 0n | Constants.Permissions.sendMessages,
          overwrite?.deny ?? 0n & ~Constants.Permissions.sendMessages,
          'role',
          '[Lockdown] Raid lock has been released.'
        );
      }

      for (const { channelID, position } of locks.state.filter(c => c.channelID !== locks.affectedIn)) {
        const channel = guild.channels.get(channelID);
        if (channel !== undefined && channel.type !== 0)
          continue;

        const overwrite = channel!.permissionOverwrites.get(guild.id);
        if (overwrite !== undefined) {
          await channel!.editPermission(
            guild.id,
            overwrite.allow | Constants.Permissions.sendMessages,
            overwrite.deny & ~Constants.Permissions.sendMessages,
            'role',
            '[Lockdown] Raid lock has been released.'
          );
        } else {
          await channel!.editPermission(
            guild.id,
            0n | Constants.Permissions.sendMessages,
            0n & ~Constants.Permissions.sendMessages,
            'role',
            '[Lockdown] Raid lock has been released.'
          );
        }

        for (const pos of position) {
          try {
            await channel!.editPermission(
              pos.id,
              pos.allow | Constants.Permissions.sendMessages,
              pos.deny & ~Constants.Permissions.sendMessages,
              pos.type,
              '[Lockdown] Raid lock has been released.'
            );
          } catch(ex) {
            console.error(ex);
          }
        }
      }
    }

    await this.redis.client.hdel('nino:raid:lockdowns:channels', guild.id);
  }
}
