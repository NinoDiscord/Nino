import { Guild } from 'eris';
import Client from '../structures/Client';
import Event from '../structures/Event';

export default class GuildJoinedEvent extends Event {
    constructor(client: Client) {
        super(client, 'guildCreate');
    }

    async emit(guild: Guild) {
        this.client.settings.create(guild.id);
        this.client.logger.log('discord', `Joined ${guild.name} (${guild.id})`);
        this.client.editStatus('online', {
            name: `${this.client.config['discord'].prefix}help | ${this.client.guilds.size.toLocaleString()} Guilds`,
            type: 0
        });
        this.client.prom.guildCount.inc();
        this.client.stats.guildCount++;
        await this.client.redis.set("guilds", this.client.guilds.size);
    }
}