import { Guild } from 'eris';
import Client from '../structures/Client';
import Event from '../structures/Event';

export default class GuildLeftEvent extends Event {
    constructor(client: Client) {
        super(client, 'guildDelete');
    }

    async emit(guild: Guild) {
        this.client.settings.remove(guild.id);
        this.client.logger.discord(`Left ${guild.name} (${guild.id})`);
        this.client.editStatus('online', {
            name: `${this.client.config['discord'].prefix}help | ${this.client.guilds.size.toLocaleString()} Guilds`,
            type: 0
        });
        this.client.webhook.send(`:x: **|** Left ${guild.name} (${guild.id}) on shard #${guild.shard.id}`);
    }
}