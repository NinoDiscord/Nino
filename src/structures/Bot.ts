import { instance, colors, ConsoleTransport, FileTransport } from 'pikmin';
import { Client, User } from 'eris';
import DatabaseManager from './managers/DatabaseManager';
import CommandManager from './managers/CommandManager';
import GuildSettings from './settings/GuildSettings';
import CaseSettings from './settings/CaseSettings';
import EmbedBuilder from './EmbedBuilder';
import EventManager from './managers/EventManager';
import Command from './Command';
import redis, { Redis } from 'ioredis';
import Warning from './settings/Warning';
import AutomodService from './services/AutomodService';
import PunishmentManager from './managers/PunishmentManager';
import TimeoutsManager from './managers/TimeoutsManager';
import BotListService from './services/BotListService';
import { Counter, register, collectDefaultMetrics, Gauge } from 'prom-client';
import { captureException } from '@sentry/node';
import { createServer } from 'http';
import { parse } from 'url';
import { setDefaults} from 'wumpfetch';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { lazyInject } from '../inversify.config';
import "reflect-metadata";

const pkg = require('../../package');
setDefaults({
    headers: { 'User-Agent': `Nino/DiscordBot (v${pkg.version}, https://github.com/auguwu/Nino)` }
});

export interface Config {
    environment: string;
    databaseUrl: string;
    discord: {
        prefix: string;
        token: string;
    };
    redis: {
        host: string;
        port: number;
    };
    webhook: {
        id: string;
        token: string;
    } | undefined;
    webserver: number | undefined;
    mode: string | undefined;
    sentryDSN: string | undefined;
    botlists: {
        topggtoken: string | undefined;
        bfdtoken: string | undefined;
        dboatstoken: string | undefined;
        blstoken: string | undefined;
    } | undefined
}

export interface CommandStats {
    commandsExecuted: number;
    messagesSeen: number;
    guildCount: number;
    commandUsage: {
        [x: string]: {
            size: number;
            users: User[];
        }
    }
}

@injectable()
export default class Bot {
    public client: Client;
    @lazyInject(TYPES.CommandManager) public manager!: CommandManager;
    public events: EventManager;
    public database: DatabaseManager;
    public logger: instance;
    public settings: GuildSettings;
    public warnings: Warning;
    public config: Config;
    public redis: Redis;
    public botlistservice: BotListService;
    public punishments = new PunishmentManager(this);
    @lazyInject(TYPES.AutoModService) public autoModService!: AutomodService;
    public cases: CaseSettings = new CaseSettings();
    public timeouts: TimeoutsManager;
    public prom = {
        messagesSeen: new Counter({ name: 'nino_messages_seen', help: 'Total messages that have been seen by Nino' }),
        commandsExecuted: new Counter({ name: 'nino_commands_executed', help: 'The number of times commands have been executed.' }),
        guildCount: new Gauge({name: 'nino_guild_count', help: 'The number of guilds Nino is in.'})
    }
    public promServer = createServer((req, res) => {
        if (parse(req.url!).pathname === '/metrics') {
            res.writeHead(200, { 'Content-Type': register.contentType });
            res.write(register.metrics());
        }

        res.end();
    });
    public owners: string[] = ['280158289667555328', '239790360728043520', '130442810456408064', '145557815287611393', '107130754189766656'];
    public stats: CommandStats = {
        commandsExecuted: 0,
        messagesSeen: 0,
        guildCount: 0,
        commandUsage: {}
    };

    constructor(@inject(TYPES.Config) config: Config, @inject(TYPES.Client) client: Client) {
        this.config   = config;
        this.client = client;
        this.redis    = new redis({
            port: config.redis['port'],
            host: config.redis['host']
        });
        this.punishments = new PunishmentManager(this);
        this.events = new EventManager(this);
        this.database = new DatabaseManager(config.databaseUrl);
        this.settings = new GuildSettings(this);
        this.warnings = new Warning();
        this.timeouts = new TimeoutsManager(this);
        this.botlistservice = new BotListService(this);
        this.logger = new instance({
            name: 'main',
            format: `${colors.bgBlueBright(process.pid.toString())} ${colors.bgBlackBright('%h:%m:%s')} <=> `,
            autogen: false,
            transports: [
                new ConsoleTransport({
                    name: 'info',
                    process: process,
                    format: `${colors.bgBlueBright(process.pid.toString())} ${colors.bgBlackBright('%h:%m:%s')} ${colors.green('[INFO]')} <=> `
                }),
                new ConsoleTransport({
                    name: 'error',
                    process: process,
                    format: `${colors.bgBlueBright(process.pid.toString())} ${colors.bgBlackBright('%h:%m:%s')} ${colors.red('[ERROR]')} <=> `
                }),
                new ConsoleTransport({
                    name: 'discord',
                    process: process,
                    format: `${colors.bgBlueBright(process.pid.toString())} ${colors.bgBlackBright('%h:%m:%s')} ${colors.cyan('[DISCORD]')} <=> `
                }),
                new FileTransport({ file: 'data/Nino.log', format: ''})
            ]
        });

        collectDefaultMetrics();
    }

    async build() {
        this.logger.log('info', 'Connecting to the database...');
        await this.database.connect();
        this.logger.log('info', 'Success! Connecting to Redis...');
        this.redis.connect().catch(() => {}); // Redis likes to throw errors smh
        this.logger.log('info', 'Success! Intializing events...');
        await this.events.start();
        this.logger.log('info', 'Success! Connecting to Discord...');
        await this.client.connect();
        this.logger.log('discord', 'Connected to Discord!');
        this.logger.log('info', 'Loading commands...');
        await this.manager.start();
        this.logger.log('info', 'All set!');
    }

    getEmbed() {
        return new EmbedBuilder()
            .setColor(0x6D6D99);
    }

    addCommandUsage(cmd: Command, user: User) {
        if (!this.stats.commandUsage[cmd.name]) this.stats.commandUsage[cmd.name] = {
            size: 0,
            users: []
        };
        this.stats.commandUsage[cmd.name].size = this.stats.commandUsage[cmd.name].size + 1;
        if (!this.stats.commandUsage[cmd.name].users.includes(user)) this.stats.commandUsage[cmd.name].users.push(user);
    }

    report(ex: Error) {
        captureException(ex);
    }
}