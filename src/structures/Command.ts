export interface CommandInfo {
    name: string;
    description: string | ((client: any) => string);
    usage?: string;
    category?: string;
    aliases?: string[];
    guildOnly?: boolean;
    ownerOnly?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    cooldown?: number;
    subcommands?: Subcommand[];
}
export interface Subcommand {
    name: string;
    description: string | ((client: any) => string);
}
export default class NinoCommand {
    public client: any;
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

    constructor(client: any, info: CommandInfo) {
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
    }

    setParent(category: string, filename: string) {
        this.parent = `${category}:${filename}`;
        return this;
    }

    format() {
        return `${this.client.config.discord.prefix}${this.name}${this.usage? (() => {
            const list = (this.subcommands.length > 1)? ` ${this.subcommands.map(s => s.name)} ${this.usage}`: ` ${this.usage}`;
            return list;
        })(): ''}`;
    }

    help() {

    }
}