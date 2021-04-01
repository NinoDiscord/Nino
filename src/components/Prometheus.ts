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

import { createServer, IncomingMessage, ServerResponse, STATUS_CODES } from 'http';
import { Component, Inject } from '@augu/lilith';
import { Logger } from 'tslog';
import Config from './Config';
import prom from 'prom-client';

export default class Prometheus implements Component {
  public commandsExecuted!: prom.Counter<string>;
  public messagesSeen!: prom.Counter<string>;
  public rawWSEvents!: prom.Counter<string>;
  public priority: number = 1;
  public name: string = 'Prometheus';
  #server!: ReturnType<typeof createServer>; // yes

  @Inject
  private logger!: Logger;

  @Inject
  private config!: Config;

  load() {
    const port = this.config.getProperty('prometheusPort');
    if (port === undefined) {
      this.logger.warn('Prometheus will not be available! This is not recommended for private instances unless you want analytics.');
      return Promise.resolve();
    }

    prom.collectDefaultMetrics();
    this.commandsExecuted = new prom.Counter({
      labelNames: ['command'],
      name: 'nino_commands_executed',
      help: 'How many commands Nino has executed successfully'
    });

    this.messagesSeen = new prom.Counter({
      name: 'nino_messages_seen',
      help: 'How many messages Nino has seen throughout the process lifespan'
    });

    this.rawWSEvents = new prom.Counter({
      labelNames: ['event'],
      name: 'nino_discord_websocket_events',
      help: 'Received WebSocket events from Discord and what they were'
    });

    this.#server = createServer(this.onRequest.bind(this));
    this.#server.once('listening', () => this.logger.info(`Prometheus: Listening at http://localhost:${port}`));
    this.#server.on('error', error => this.logger.fatal(error));
    this.#server.listen(port);
  }

  private async onRequest(req: IncomingMessage, res: ServerResponse) {
    this.logger.debug(`Prometheus: ${req.method!.toUpperCase()} ${req.url} (${res.statusCode} ${STATUS_CODES[res.statusCode] ?? 'Unknown'})`);
    if (req.url! === '/metrics') {
      res.writeHead(200, { 'Content-Type': prom.register.contentType });
      res.write(await prom.register.metrics());
    } else if (req.url! === '/favicon.ico') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.write('{"fuck":"you uwu"}');
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.write('{"uwu":"owo"}');
    }

    res.end();
  }
}
