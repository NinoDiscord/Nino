import { Collection } from '@augu/immutable';
import { Message, Client } from 'eris';

export interface Collector {
    filter: (m: Message) => boolean;
    accept: (value?: Message | PromiseLike<Message>) => void;
}

export default class MessageCollector {
    public collectors: Collection<Collector> = new Collection('collectors');

    constructor(client: Client) {
        client.on('messageCreate', this.verify.bind(this));
    }

    verify(m: Message) {
        if (!m.author) return;

        const collector = this.collectors.get(`${m.channel.id}:${m.author.id}`);
        if (collector && collector.filter(m)) collector.accept(m);
    }

    awaitMessage(filter: (m: Message) => boolean, info: { channelID: string; userID: string; timeout: number; }) {
        return new Promise<Message>((accept) => {
            const collector = this.collectors.get(`${info.channelID}:${info.userID}`);
            if (collector) this.collectors.delete(`${info.channelID}:${info.userID}`);

            this.collectors.set(`${info.channelID}:${info.userID}`, { filter, accept });
            setTimeout(accept.bind<any, any, any[], any>(null, false), info.timeout * 1000);
        });
    }
}