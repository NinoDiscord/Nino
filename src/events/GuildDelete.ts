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
    }
}