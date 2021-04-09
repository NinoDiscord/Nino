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

@Component({
  priority: 1,
  name: 'timeouts'
})
export default class TimeoutsManager {
  protected _connectTimeout?: NodeJS.Timeout;
  protected _readyPromise?: { resolve(): void, reject(error: Error): void; };

  public priority: number = 69;
  private socket!: WebSocket;
  public state: types.SocketState = types.SocketState.Unknown;
  public name: string = 'timeouts';

  @Inject
  private punishments!: PunishmentService;

  @Inject
  private discord!: Discord;

  @Inject
  private logger!: Logger;

  @Inject
  private config!: Config;

  load() {
    return new Promise<void>((resolve, reject) => {
      this._readyPromise = { resolve, reject };
      this.state = types.SocketState.Connecting;
      this.logger.info('Connecting to the timeouts service!');

      const timeouts = this.config.getProperty('timeouts');
      if (timeouts === undefined)
        return reject('Missing `timeouts` configuration, refer to the Process section: https://github.com/NinoDiscord/Nino#config-timeouts');

      this.socket = new WebSocket(`ws://${timeouts.host ?? 'localhost'}:${timeouts.port}`, {
        headers: {
          Authorization: timeouts.auth
        }
      });

      this.socket.on('open', this._onOpen.bind(this));
      this.socket.on('error', this._onError.bind(this));
      this.socket.on('close', this._onClose.bind(this));
      this.socket.on('message', this._onMessage.bind(this));

      this._connectTimeout = setTimeout(() => {
        delete this._connectTimeout;
        delete this._readyPromise;

        return reject(new Error('Connection to timeouts service took too long.'));
      }, 15000);
    });
  }

  send(op: types.OPCodes.Request, data: types.RequestPacket['d']): void;
  send(op: types.OPCodes.Acknowledged): void;
  send(op: types.OPCodes, d?: any) {
    this.socket.send(JSON.stringify({
      op,
      d
    }));
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
    // todo: reconnect?
  }

  private async _onMessage(message: string) {
    const data: types.DataPacket<any> = JSON.parse(message);
    switch (data.op) {
      case types.OPCodes.Ready: {
        const packet = data as types.ReadyPacket;
        this.logger.info(`Authenicated successfully! We have ${packet.d.timeouts.length} timeouts to handle.`);
        for (let i = 0; i < packet.d.timeouts.length; i++) {
          const timeout = packet.d.timeouts[i];
          const guild = this.discord.client.guilds.get(timeout.guild);
          if (guild === undefined) {
            this.logger.warn(`Guild ${timeout.guild} has pending timeouts but Nino isn't in the guild? Skipping...`);
            continue;
          }

          await this.punishments.apply({
            moderator: this.discord.client.users.get(this.discord.client.user.id)!,
            reason: 'Time is up.',
            member: { id: timeout.user, guild },
            type: timeout.type
          });
        }

        this.logger.info('Successfully applied packets.');
        this.send(types.OPCodes.Acknowledged);
      } break;

      case types.OPCodes.Apply: {
        const packet = data as types.ApplyPacket;
        this.logger.debug(`Told to apply a packet on user ${packet.d.user} in guild ${packet.d.guild}.`);

        const guild = this.discord.client.guilds.get(packet.d.guild);
        if (guild === undefined) {
          this.logger.warn(`Guild ${packet.d.guild} has pending timeouts but Nino isn't in the guild? Skipping...`);
          break;
        }

        await this.punishments.apply({
          moderator: this.discord.client.users.get(packet.d.moderator)!,
          reason: packet.d.reason,
          member: { id: packet.d.user, guild },
          type: packet.d.type
        });
      } break;
    }
  }
}
