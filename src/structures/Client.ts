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

export interface NinoConfig {
    databaseUrl: string;
    discord: {
        prefix: string;
        token: string;
    }
    redis: {
        host: string;
        port: number;
    }
}

export interface CommandStats {
    commandsExecuted: number;
    messagesSeen: number;
    commandUsage: {
        [x: string]: {
            size: number;
            users: User[];
        }
    }
}

export default class NinoClient extends Client {
    public manager: CommandManager;
    public events: EventManager;
    public database: DatabaseManager;
    public logger: instance;
    public settings: GuildSettings;
    public config: NinoConfig;
    public redis: Redis;
    public cases: CaseSettings = new CaseSettings();
    // LIST: August, Dondish, Kyle, Derpy, Wessel
    public owners: string[] = ['280158289667555328', '239790360728043520', '130442810456408064', '145557815287611393', '107130754189766656'];
    public stats: CommandStats = {
        commandsExecuted: 0,
        messagesSeen: 0,
        commandUsage: {}
    };

    constructor(config: NinoConfig) {
        super(config.discord.token, {
            maxShards: 'auto',
            disableEveryone: true,
            getAllUsers: true
        });

        this.config   = config;
        this.redis    = new redis({
            port: config.redis['port'],
            host: config.redis['host']
        });
        this.manager  = new CommandManager(this);
        this.events = new EventManager(this);
        this.database = new DatabaseManager(config.databaseUrl);
        this.settings = new GuildSettings(this);
        this.logger = new instance({
            name: 'main',
            format: `${colors.bgBlueBright(process.pid.toString())} ${colors.bgBlackBright('%h:%m:%s')} <=>`,
            autogen: false,
            transports: [
                new ConsoleTransport({
                    name: 'info',
                    process: process,
                    format: `${colors.bgBlueBright(process.pid.toString())} ${colors.bgBlackBright('%h:%m:%s')} ${colors.green('[INFO]')} <=>`
                }),
                new ConsoleTransport({
                    name: 'error',
                    process: process,
                    format: `${colors.bgBlueBright(process.pid.toString())} ${colors.bgBlackBright('%h:%m:%s')} ${colors.red('[ERROR]')} <=>`
                }),
                new ConsoleTransport({
                    name: 'discord',
                    process: process,
                    format: `${colors.bgBlueBright(process.pid.toString())} ${colors.bgBlackBright('%h:%m:%s')} ${colors.cyan('[DISCORD]')} <=>`
                }),
                new FileTransport({ file: 'data/Nino.log' })
            ]
        });
    }

    async build() {
        this.manager.start();
        this.events.start();
        this.database.connect();
        this.redis.connect();
        await super.connect()
            .then(() => this.logger.discord('Now connecting to Discord!'));
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

        this.stats.commandUsage[cmd.name].size++;
        this.stats.commandUsage[cmd.name].users.push(user);
    }
}