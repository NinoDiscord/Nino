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

import { USER_MENTION_REGEX, USERNAME_DISCRIM_REGEX, ID_REGEX, CHANNEL_REGEX, ROLE_REGEX } from '../util/Constants';
import { Component, Inject, ComponentAPI, Subscribe } from '@augu/lilith';
import { Client, Role, Guild, AnyChannel } from 'eris';
import { pluralize } from '@augu/utils';
import Prometheus from './Prometheus';
import { Logger } from 'tslog';
import Config from './Config';

@Component({
  priority: 0,
  name: 'discord'
})
export default class Discord {
  public mentionRegex?: RegExp;
  public client!: Client;
  api!: ComponentAPI;

  @Inject
  private readonly prometheus?: Prometheus;

  @Inject
  private readonly config!: Config;

  @Inject
  private readonly logger!: Logger;

  load() {
    if (this.client !== undefined) {
      this.logger.warn('A client has already been created.');
      return;
    }

    const token = this.config.getProperty('token');
    if (token === undefined) {
      this.logger.fatal('Property `token` doesn\'t exist in the config file, please populate it.');
      return;
    }

    this.logger.info('Booting up the bot...');
    this.client = new Client(token, {
      getAllUsers: true,
      maxShards: 'auto',
      restMode: true,
      intents: [
        'guilds',
        'guildBans',
        'guildMembers',
        'guildMessages',
        'guildVoiceStates'
      ]
    });

    this.api.container.addEmitter('discord', this.client);
    return this.client.connect();
  }

  dispose() {
    return this.client.disconnect({ reconnect: false });
  }

  get emojis() {
    return this.client.guilds.map(guild => guild.emojis.map(emoji => `<${emoji.animated ? 'a:' : ':'}${emoji.name}:${emoji.id}>`)).flat();
  }

  async getUser(query: string) {
    if (USER_MENTION_REGEX.test(query)) {
      const match = USER_MENTION_REGEX.exec(query);
      if (match === null)
        return null;

      const user = this.client.users.get(match[1]);
      if (user !== undefined) {
        return user;
      } else {
        return this.client.getRESTUser(match[1]).catch(() => null);
      }
    }

    if (USERNAME_DISCRIM_REGEX.test(query)) {
      const match = query.match(USERNAME_DISCRIM_REGEX)!;
      const users = this.client.users.filter(user =>
        user.username === match[1] && Number(user.discriminator) === Number(match[2])
      );

      // TODO: pagination?
      if (users.length > 0)
        return users[0];
    }

    if (ID_REGEX.test(query)) {
      const user = this.client.users.get(query);
      if (user !== undefined)
        return user;
      else
        return this.client.getRESTUser(query);
    }

    return null;
  }

  getChannel<T extends AnyChannel = AnyChannel>(query: string, guild?: Guild) {
    return new Promise<T | null>(resolve => {
      if (CHANNEL_REGEX.test(query)) {
        const match = CHANNEL_REGEX.exec(query);
        if (match === null)
          return resolve(null);

        if (guild) {
          return resolve(guild.channels.has(match[1]) ? guild.channels.get(match[1])! as T : null);
        } else {
          const channel = match[1] in this.client.channelGuildMap && this.client.guilds.get(this.client.channelGuildMap[match[1]])?.channels.get(match[1]);
          return resolve(channel as T || null);
        }
      }

      if (ID_REGEX.test(query)) {
        if (guild) {
          return resolve(guild.channels.has(query) ? guild.channels.get(query)! as T : null);
        } else {
          const channel = query in this.client.channelGuildMap && this.client.guilds.get(this.client.channelGuildMap[query])?.channels.get(query);
          return resolve(channel as T || null);
        }
      }

      if (guild !== undefined) {
        const channels = guild.channels.filter(chan => chan.name.toLowerCase().includes(query.toLowerCase()));
        if (channels.length > 0) {
          return resolve(channels[0] as T);
        }
      }

      resolve(null);
    });
  }

  getRole(query: string, guild: Guild) {
    return new Promise<Role | null>(resolve => {
      if (ROLE_REGEX.test(query)) {
        const match = ROLE_REGEX.exec(query)!;
        if (match === null)
          return resolve(null);

        const role = guild.roles.get(match[1]);

        if (role !== undefined)
          return resolve(role);
      }

      if (ID_REGEX.test(query))
        return resolve(guild.roles.has(query) ? guild.roles.get(query)! : null);

      const roles = guild.roles.filter(role =>
        role.name.toLowerCase() === query.toLowerCase()
      );

      // TODO: pagination?
      resolve(roles.length > 0 ? roles[0] : null);
    });
  }

  @Subscribe('shardReady', { emitter: 'discord' })
  private onShardReady(id: number) {
    this.logger.info(`Shard #${id} is now ready.`);
  }

  @Subscribe('shardDisconnect', { emitter: 'discord' })
  private onShardDisconnect(error: any, id: number) {
    this.logger.fatal(`Shard #${id} has disconnected from the universe\n`, error || 'Connection has been reset by peer.');
  }

  @Subscribe('shardResume', { emitter: 'discord' })
  private onShardResume(id: number) {
    this.logger.info(`Shard #${id} has resumed it's connection!`);
  }
}
