import { Counter, Gauge, register } from 'prom-client';
import { Server, createServer } from 'http';
import { inject, injectable } from 'inversify';
import { TYPES as Types } from '../../types';
import { parse } from 'url';
import Bot from '../Bot';

@injectable()
export default class PrometheusManager {
    public commandsExecuted: Counter;
    public messagesSeen: Counter;
    public guildCount: Gauge;
    public server: Server;
    public bot: Bot;

    constructor(
        @inject(Types.Bot) bot: Bot
    ) {
      this.commandsExecuted = new Counter({
        name: 'nino_commands_executed',
        help: 'The number of times commands has been executed'
      });

      this.messagesSeen = new Counter({
        name: 'nino_messages_seen',
        help: 'Total messages that have been seen by Nino'
      });

      this.guildCount = new Gauge({
        name: 'nino_guild_count',
        help: 'The number of guilds Nino is in.',
      });

      this.server = createServer((req, res) => {
        if (parse(req.url!).pathname === '/metrics') {
          res.writeHead(200, { 'Content-Type': register.contentType });
          res.write(register.metrics());
        }

        res.end();
      });

      this.bot = bot;
    }
}