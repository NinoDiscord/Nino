import Context from './Context';
import Client from './Client';

export interface CommandInfo {
    name: string;
    description: string | ((client: Client) => string);
    usage?: string;
    category?: string;
    aliases?: string[];
    guildOnly?: boolean;
    ownerOnly?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    cooldown?: number;
    subcommands?: Subcommand[];
    botpermissions?: number;
    userpermissions?: number;
}
export interface Subcommand {
    name: string;
    description: string | ((client: Client) => string);
    run: (client: Client, ctx: Context) => Promise<any>;
}
export default class NinoCommand {
    public client: Client;
    public id: number | null = null;
    public name: string;
    public description: string;
    public usage: string;
    public category: string;
    public aliases: string[];
    public guildOnly: boolean;
    public ownerOnly: boolean;
    public disabled: boolean;
    public hidden: boolean;
    public cooldown: number;
    public subcommands: Subcommand[];
    public parent: string | null = null;
    public botpermissions: number;
    public userpermissions: number;

    constructor(client: Client, info: CommandInfo) {
        this.client      = client;
        this.name        = info.name;
        this.description = (typeof info.description === 'function')? info.description(client): info.description;
        this.usage       = info.usage || '';
        this.category    = info.category || 'Generic';
        this.aliases     = info.aliases || [];
        this.guildOnly   = info.guildOnly || false;
        this.ownerOnly   = info.ownerOnly || false;
        this.disabled    = info.disabled || false;
        this.hidden      = info.hidden || false;
        this.cooldown    = info.cooldown || 5;
        this.subcommands = info.subcommands || [];
        this.botpermissions = info.botpermissions || 0;
        this.userpermissions = info.userpermissions || 0;
    }

    async run(ctx: Context): Promise<any> {
        return ctx.send(`The command \`${this.name}\` is disabled due to no functionality.`);
    }

    setParent(category: string, filename: string) {
        this.parent = `${category}:${filename}`;
        return this;
    }

    setID(id: number) {
        this.id = id;
        return this;
    }

    format() {
        return `${this.client.config.discord.prefix}${this.name}${this.usage? (() => {
            const list = (this.subcommands.length > 1)? ` ${this.subcommands.map(s => s.name)} ${this.usage}`: ` ${this.usage}`;
            return list;
        })(): ''}`;
    }

    help() {
        return this
            .client
            .getEmbed();
    }
}