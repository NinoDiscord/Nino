import { NinoConfig } from './Client';
import EmbedBuilder from './EmbedBuilder';
import w from 'wumpfetch';

export default class WebhookClient {
    public url: string;

    constructor(config: NinoConfig) {
        this.url = `https://discordapp.com/api/webhooks/${config.webhook['id']}/${config.webhook['token']}?wait=true`;
    }

    async send(content: string) {
        await w(this.url, {
            method: 'POST',
            data: {
                content
            }
        }).send();
    }

    async embed(embed: EmbedBuilder) {
        const payload = embed.build();
        await w(this.url, {
            method: 'POST',
            data: {
                embeds: [payload]
            }
        }).send();
    }
}