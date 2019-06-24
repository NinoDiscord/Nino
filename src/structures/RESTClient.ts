import { Role, TextChannel, CategoryChannel, VoiceChannel } from 'eris';

export type AnyRESTChannel = TextChannel | CategoryChannel | VoiceChannel;
export default class RESTClient {
    public client: any;

    constructor(client: any) {
        this.client = client;
    }

    getRole(info: { query: string; guild: Guild; }) {
        const { query, guild } = info;

        return new Promise<Role>((resolve, reject) => {
            if (/^\d+$/.test(query)) {
                const role = guild.roles.get(query);
                if (role) return resolve(query);
            } else if (/<@&(\d+)>$/.test(query)) {
                const match = query.match(/^<@&(\d+)>$/);
                const role  = guild.roles.get(match[1]);
                if (role) return resolve(query);
            } else {
                const roles = guild.roles.filter((role) => role.name.toLowerCase().includes(query.toLowerCase()));
                if (roles.length > 0) return resolve(roles[0]);
            }

            reject();
        });
    }

    getChannel(info: { query: string; guild: Guild; }) {
        const { query, guild } = info;

        return new Promise<AnyRESTChannel>((resolve, reject) => {
            if (/^\d+$/.test(query)) {
                if (guild) {
                    if (!guild.channels.has(query)) reject();
                    resolve(guild.channels.get(query));
                } else {
                    const channel = query in this.client.channelGuildMap && this.client.guilds.get(this.client.channelGuildMap[query]).channels.get(query);
                    if (channel) return resolve(channel);
                }
            } else if (/^<#(\d+)>$/.test(query)) {
                const match = query.match(/^<#(\d+)>$/);
                if (guild) {
                    if (!guild.channels.has(match[1])) reject();
                    resolve(guild.channels.get(match[1]));
                } else {
                    const channel = match[1] in this.client.channelGuildMap && this.client.guilds.get(this.client.channelGuildMap[match[1]]).channels.get(query);
                    if (channel) return resolve(channel);
                }
            } else if (guild) {
                const channel = guild.channels.filter((channel) => channel.name.toLowerCase().includes(query.toLowerCase()));
                if (channel.length > 0) return resolve(channel[0]);
            } 
      
            reject();
        });
    }
}