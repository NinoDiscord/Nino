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

import PunishmentService from '../../services/PunishmentService';
import { Component, Inject } from '@augu/lilith';
import * as types from './types';
import { Logger } from 'tslog';
import WebSocket from 'ws';
import Discord from '../../components/Discord';
import Config from '../../components/Config';
import Redis from '../../components/Redis';

interface ApplyTimeoutOptions {
  moderator: string;
  reason?: string;
  victim: string;
  guild: string;
  time: number;
  type: types.PunishmentTimeoutType;
}

@Component({
  priority: 6,
  name: 'timeouts',
})
export default class TimeoutsManager {
  protected _reconnectTimeout?: NodeJS.Timeout;
  protected _connectTimeout?: NodeJS.Timeout;
  protected _readyPromise?: { resolve(): void; reject(error: Error): void };

  private socket!: WebSocket;
  public state: types.SocketState = types.SocketState.Unknown;

  @Inject
  private punishments!: PunishmentService;

  @Inject
  private discord!: Discord;

  @Inject
  private logger!: Logger;

  @Inject
  private redis!: Redis;

  @Inject
  private config!: Config;

  load() {
    return new Promise<void>((resolve, reject) => {
      this._readyPromise = { resolve, reject };
      this.state = types.SocketState.Connecting;
      this.logger.info(
        this._reconnectTimeout !== undefined ? 'Reconnecting to the timeouts service...' : 'Connecting to the timeouts service!'
      );

      const host = this.config.getProperty('timeouts.host');
      const port = this.config.getProperty('timeouts.port');
      const auth = this.config.getProperty('timeouts.auth');

      // @ts-ignore yes
      if (this.config.getProperty('timeouts') === undefined)
        return reject(
          'Missing `timeouts` configuration, refer to the Process section: https://github.com/NinoDiscord/Nino#config-timeouts'
        );

      this.socket = new WebSocket(`ws://${host ?? 'localhost'}:${port}`, {
        headers: {
          Authorization: auth,
        },
      });

      if (this._reconnectTimeout !== undefined) clearTimeout(this._reconnectTimeout);

      delete this._reconnectTimeout;
      this.socket.on('open', this._onOpen.bind(this));
      this.socket.on('error', this._onError.bind(this));
      this.socket.on('close', this._onClose.bind(this));
      this.socket.on('message', this._onMessage.bind(this));

      this._connectTimeout = setTimeout(() => {
        clearTimeout(this._connectTimeout!);

        delete this._connectTimeout;
        delete this._readyPromise;
        return reject(new Error('Connection to timeouts service took too long.'));
      }, 15000);
    });
  }

  dispose() {
    return this.socket.close();
  }

  send(op: types.OPCodes.Request, data: types.RequestPacket['d']): void;
  send(op: types.OPCodes.Acknowledged, data: types.AcknowledgedPacket['d']): void;
  send(op: types.OPCodes, d?: any) {
    this.socket.send(
      JSON.stringify({
        op,
        d,
      })
    );
  }

  async apply({ moderator, reason, victim, guild, time, type }: ApplyTimeoutOptions) {
    const list = await this.redis.getTimeouts(guild);
    list.push({
      moderator,
      reason: reason === undefined ? null : reason,
      expired: Date.now() + time,
      issued: Date.now(),
      guild,
      user: victim,
      type,
    });

    await this.redis.client.hmset('nino:timeouts', [guild, JSON.stringify(list)]);
    this.send(types.OPCodes.Request, {
      moderator,
      reason: reason === undefined ? null : reason,
      expired: Date.now() + time,
      issued: Date.now(),
      guild,
      user: victim,
      type,
    });

    return Promise.resolve();
  }

  private _onOpen() {
    this.logger.info('Established a connection with the timeouts service.');
    this.state = types.SocketState.Connected;

    if (this._connectTimeout !== undefined) clearTimeout(this._connectTimeout);
    this._readyPromise?.resolve();

    delete this._readyPromise;
  }

  private _onError(error: Error) {
    this.logger.error(error);
  }

  private _onClose(code: number, reason: string) {
    this.logger.warn(`Timeouts service has closed our connection with "${code}: ${reason}"`);

    this._reconnectTimeout = setTimeout(() => {
      this.logger.info('Attempting to reconnect...');
      this.load();
    }, 2500);
  }

  private async _onMessage(message: string) {
    const data: types.DataPacket<any> = JSON.parse(message);
    switch (data.op) {
      case types.OPCodes.Ready:
        {
          this.logger.info('Authenicated successfully, now sending timeouts...');
          const timeouts = await this.redis.client
            .hvals('nino:timeouts')
            .then((value) => (value[0] !== '' ? value.map((val) => JSON.parse<types.Timeout>(val)).flat() : ([] as types.Timeout[])));
          this.logger.info(`Received ${timeouts.length} timeouts to relay`);

          this.send(types.OPCodes.Acknowledged, timeouts);
        }
        break;

      case types.OPCodes.Apply:
        {
          const packet = data as types.ApplyPacket;
          this.logger.debug(`Told to apply a packet on user ${packet.d.user} in guild ${packet.d.guild}.`);

          const guild = this.discord.client.guilds.get(packet.d.guild);
          if (guild === undefined) {
            this.logger.warn(`Guild ${packet.d.guild} has pending timeouts but Nino isn't in the guild? Skipping...`);
            break;
          }

          const timeouts = await this.redis.getTimeouts(packet.d.guild);
          const available = timeouts.filter(
            (pkt) => packet.d.user !== pkt.user && packet.d.type.toLowerCase() !== pkt.type.toLowerCase() && pkt.guild === packet.d.guild
          );

          await this.redis.client.hmset('nino:timeouts', [guild.id, JSON.stringify(available)]);
          await this.punishments.apply({
            moderator: this.discord.client.user,
            publish: true,
            reason: packet.d.reason === null ? '[Automod] Time is up.' : packet.d.reason,
            member: { id: packet.d.user, guild },
            type: packet.d.type,
          });
        }
        break;
    }
  }
}
