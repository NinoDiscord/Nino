import { Guild } from 'eris';
import Client from '../structures/Bot';
import Event from '../structures/Event';

export default class GuildLeftEvent extends Event {
    constructor(client: Client) {
        super(client, 'guildDelete');
    }

    async emit(guild: Guild) {
        this.bot.settings.remove(guild.id);
        this.bot.logger.log('discord', `Left ${guild.name} (${guild.id})`); // eslint-disable-line
        this.bot.client.editStatus('online', {
            name: `${this.bot.config['discord'].prefix}help | ${this.bot.client.guilds.size.toLocaleString()} Guilds`,
            type: 0
        });
        this.bot.prom.guildCount.dec();
        this.bot.stats.guildCount--;
        await this.bot.redis.set('guilds', this.bot.client.guilds.size);
    }
}