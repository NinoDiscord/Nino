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

import type { GatewayInteractionCreateDispatchData, APIApplicationCommandInteractionData } from 'discord-api-types';
import { RawPacket, AnyGuildChannel, Message } from 'eris';
import type { ApplicationCommandOption } from 'slash-commands';
import { Inject, Subscribe } from '@augu/lilith';
import BotlistsService from '../services/BotlistService';
import { Logger } from 'tslog';
import Discord from '../components/Discord';
import Config from '../components/Config';
import Prom from '../components/Prometheus';

export default class VoidListener {
  @Inject
  private readonly prometheus?: Prom;

  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly botlists?: BotlistsService;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly config!: Config;

  @Subscribe('rawWS', { emitter: 'discord' })
  async onRawWS(packet: RawPacket) {
    if (!packet.t) return;

    if (packet.t === 'INTERACTION_CREATE') {
      const data = packet.d as GatewayInteractionCreateDispatchData;
      if (data.type === 2) {
        this.logger.info('Received slash command metadata!');

        // skip on dm interaction
        if (data.guild_id === undefined)
          return;

        await this._handleInteractionCreatePacket(data);
      }
    }

    this.prometheus?.rawWSEvents?.labels(packet.t).inc();
  }

  @Subscribe('ready', { emitter: 'discord' })
  async onReady() {
    this.logger.info(
      `Connected as ${this.discord.client.user.username}#${this.discord.client.user.discriminator} (ID: ${this.discord.client.user.id})`
    );
    this.logger.info(
      `Guilds: ${this.discord.client.guilds.size.toLocaleString()} | Users: ${this.discord.client.users.size.toLocaleString()}`
    );

    this.prometheus?.guildCount?.set(this.discord.client.guilds.size);
    await this.botlists?.post();
    this.discord.mentionRegex = new RegExp(
      `^<@!?${this.discord.client.user.id}> `
    );

    const prefixes = this.config.getProperty('prefixes') ?? ['x!'];
    const statusType = this.config.getProperty('status.type');
    const status = this.config.getProperty('status.status')!;

    for (const shard of this.discord.client.shards.values()) {
      this.discord.client.editStatus(
        this.config.getProperty('status.presence') ?? 'online',
        {
          name: status
            .replace(
              '$prefix$',
              prefixes[Math.floor(Math.random() * prefixes.length)]
            )
            .replace(
              '$guilds$',
              this.discord.client.guilds.size.toLocaleString()
            )
            .replace('$shard$', `#${shard.id}`),

          type: statusType ?? 0,
        }
      );
    }
  }

  private _format(command: ApplicationCommandOption): [content: string, users?: string[], roles?: string[]] {
    if (!command.options)
      return [`/${command.name}`, undefined, undefined];

    const roleMentions: string[] = [];
    const userMentions: string[] = [];
    let content = `/${command.name}`;

    const formatArg = (arg: ApplicationCommandOption & { value: any }) => {
      if (arg.options !== undefined) {
        const args = arg.options?.map(formatArg as any);
        return `${arg.name}${args !== undefined ? ` ${args.join(' ')}` : ''}`;
      }

      if (['member', 'user'].some(a => arg.name.startsWith(a))) {
        userMentions.push(arg.value);
        return `<@!${arg.value}>`;
      } else if (arg.name === 'channel') {
        return `<@#${arg.value}>`;
      } else if (arg.name === 'role') {
        roleMentions.push(arg.value);
        return `<@&${arg.value}>`;
      } else {
        return arg.value;
      }
    };

    command.options?.forEach(option => {
      const choices = (option.choices?.length ?? false) ? option.choices!.map((c: any) => c !== undefined ? undefined : `${c.name}: ${c.value}`).filter(s => s !== undefined) : null;
      if (choices !== null) {
        content += ` ${choices.join(', ')}`;
        return;
      }

      content += ` ${formatArg(option as any)}`;
    });

    return [content, roleMentions, userMentions];
  }

  private async _handleInteractionCreatePacket(data: GatewayInteractionCreateDispatchData) {
    const { data: command, guild_id: guildID, channel_id: channelID } = data;
    const guild = this.discord.client.guilds.get(guildID as string);
    const channel = await this.discord.getChannel<AnyGuildChannel>(channelID as string);

    // not cached, don't care lol
    if (!guild || channel === null)
      return;

    this.logger.info(`Received slash command /${(command as APIApplicationCommandInteractionData).name} uwu`);
    const [content, userMentions, roleMentions] = this._format(command as any);
    const uncachedUsers = userMentions?.filter(s => !this.discord.client.users.has(s)) ?? [];

    if (uncachedUsers.length > 0) {
      (await Promise.all(uncachedUsers.map(s => this.discord.client.getRESTUser(s)))).map(user => this.discord.client.users.update(user));
    }

    this.discord.client.emit('messageCreate', new Message({
      id: null as any,
      timestamp: new Date().toISOString(),
      channel_id: channelID as string,
      guild_id: guildID,
      content,
      mention_roles: roleMentions,
      type: 0,
      author: {

      }
    }, this.discord.client));
  }
}
