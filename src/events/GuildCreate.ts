import { Guild } from 'eris';
import Client from '../structures/Client';
import Event from '../structures/Event';

export default class GuildJoinedEvent extends Event {
    constructor(client: Client) {
        super(client, 'guildCreate');
    }

    async emit(guild: Guild) {
        this.client.settings.create(guild.id);
        this.client.logger.discord(`Joined ${guild.name} (${guild.id})`);
    }
}