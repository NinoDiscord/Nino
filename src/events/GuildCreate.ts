import { Guild } from 'eris';
import Client from '../structures/Bot';
import Event from '../structures/Event';

export default class GuildJoinedEvent extends Event {
    constructor(client: Client) {
        super(client, 'guildCreate');
    }

    async emit(guild: Guild) {
        this.bot.settings.create(guild.id);
        this.bot.logger.log('discord', `Joined ${guild.name} (${guild.id})`);
        this.bot.client.editStatus('online', {
            name: `${this.bot.config['discord'].prefix}help | ${this.bot.client.guilds.size.toLocaleString()} Guilds`,
            type: 0
        });
        this.bot.prom.guildCount.inc();
        this.bot.stats.guildCount++;
        await this.bot.redis.set('guilds', this.bot.client.guilds.size);
    }
}