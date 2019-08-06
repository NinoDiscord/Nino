import Webserver from '../webserver/server';
import Client from '../structures/Client';
import Event from '../structures/Event';

export default class ReadyEvent extends Event {
    public web: Webserver;

    constructor(client: Client) {
        super(client, 'ready');
        this.web = new Webserver(client);
    }

    async emit() {
        this.client.logger.discord(`Logged in as ${this.client.user.username}#${this.client.user.discriminator} (${this.client.user.id})`);
        this.client.editStatus('online', {
            name: `${this.client.config['discord'].prefix}help | ${this.client.guilds.size.toLocaleString()} Guilds`,
            type: 0
        });
        setInterval(() => {
            this.client.editStatus('online', {
                name: `${this.client.config['discord'].prefix}help | ${this.client.guilds.size.toLocaleString()} Guilds`,
                type: 0
            });
        }, 600000);
        this.client.promServer.listen(5595, () => this.client.logger.info('Metrics is now listening on port "5595"'));
        await this.client.redis.set("guilds", this.client.guilds.size);
        this.client.stats.guildCount = this.client.guilds.size;
        this.client.prom.guildCount.set(this.client.stats.guildCount, Date.now())
        this.client.botlistservice.start();
        this.client.timeouts.reapplyTimeouts();
        this.web.start();
    }
}