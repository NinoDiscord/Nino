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

import { Component, Inject } from '@augu/lilith';
import consola, { Consola } from 'consola';
import WebSocket from 'ws';
import Config from './Config';

/**
 * Represents the state of the {@link Relay} component.
 */
export enum State {
  /**
   * It is available so you can aggregate information from you -> Nino.
   */
  Available,

  /**
   * This component hasn't been initialized
   */
  NotInit,

  /**
   * The relay service is dead, you shouldn't connect at this time.
   */
  Dead,
}

type OPCode = 'commands' | 'opened' | 'error';

/**
 * Represents the request the subscriber has requested from the
 * relay publisher.
 */
interface Request {
  /**
   * The OPCode to use, for right now, this is only towards command lists.
   */
  op: 'commands' | 'opened' | 'error';
}

/**
 * Represents the relay service that comes with [cluster-operator](https://github.com/MikaBot/cluster-operator),
 * which you can relay events to receive packets.
 */
@Component({ name: 'relay', priority: 1 })
export default class Relay {
  private _connectionPromise?: { resolve(): void; reject(error?: any): void };
  private _reconnectTimeout?: NodeJS.Timeout;
  private readonly logger: Consola = consola.withScope('nino:relay');
  private socket!: WebSocket;

  @Inject
  private readonly config!: Config;

  load() {
    const isEnabled = this.config.get('relay', false);
    if (isEnabled !== true) {
      this.logger.warn('Relay publisher is not enabled in config (`relay` = false or not found)');
      return Promise.resolve(); // resolve so Lilith doesn't freak out
    }

    // check if clustering is enabled
    const clustering = this.config.get('clustering');
    if (clustering === undefined) {
      this.logger.warn('Clustering is not enabled in config (`clustering` object not found)');
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      this.logger.info('Connecting to relay server as publisher...');

      this.socket = new WebSocket(`ws://${clustering.host ?? 'localhost'}:${clustering.port}/relay`, {
        headers: {
          Authorization: clustering.auth,
        },
      });

      this.socket
        .on('message', this.#onMessage.bind(this))
        .on('close', this.#onClose.bind(this))
        .on('error', this.#onError.bind(this))
        .on('open', this.#onOpen.bind(this));

      this._connectionPromise = { resolve, reject };
      this._reconnectTimeout = setTimeout(() => {
        this.logger.error(`Unable to reach to ws://${clustering.host ?? 'localhost'}:${clustering.port}/relay`);
        return reject(new Error('View console trace above'));
      }, 15000);
    });
  }

  #onMessage(data: WebSocket.Data) {
    if (Buffer.isBuffer(data) || (Array.isArray(data) && data.every((i) => Buffer.isBuffer(i)))) {
      this.socket.send(
        JSON.stringify({
          type: 0,
          op: 'error',
          d: {
            message: 'Using binary is not supported.',
          },
        })
      );

      return;
    }

    let packet!: Request;
    try {
      packet = JSON.parse<Request>(data as string);
    } catch (ex) {
      const error = ex as Error;
      this.socket.send(
        JSON.stringify({
          type: 0,
          op: 'error',
          d: {
            message: 'Unable to deserialize data',
            ...(process.env.NODE_ENV === 'development' && {
              exception: {
                message: error.message,
                stack: error.stack?.split('\n') ?? [],
              },
            }),
          },
        })
      );

      return;
    }

    this.logger.info(`Received operation code ${packet.op}!`);
    switch (packet.op as Exclude<OPCode, 'opened' | 'error'>) {
      case 'commands':
        {
          this.socket.send(
            JSON.stringify({
              type: 0,
              op: 'commands',
              d: [],
            })
          );
        }
        break;
    }
  }

  #onClose(code: number, reason: string) {
    this.logger.error(`Relay server was closed with code ${code} with reason ${reason}.`);

    // TODO: add reason shit lol
  }

  #onError(ex: Error) {
    this.logger.error('Received exception on WebSocket connection', ex);
  }

  #onOpen() {
    this.logger.info('Established with relay server.');
    if (this._reconnectTimeout !== undefined) clearTimeout(this._reconnectTimeout);

    this._connectionPromise?.resolve();
    if (this._connectionPromise !== undefined) delete this._connectionPromise;
  }
}
