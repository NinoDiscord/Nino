import Client from '../structures/Client';
import Event from '../structures/Event';

export default class ReadyEvent extends Event {
    constructor(client: Client) {
        super(client, 'ready');
    }

    async emit() {
        this.client.logger.discord(`Logged in as ${this.client.user.username}#${this.client.user.discriminator} (${this.client.user.id})`);
        this.client.editStatus('online', {
            name: `${this.client.config.discord.prefix}help | ${this.client.guilds.size} Guild${this.client.guilds.size > 1? 's': ''}`,
            type: 0
        });
    }
}