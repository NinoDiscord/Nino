import { Message, TextChannel } from 'eris';
import RedisQueue from '../../util/RedisQueue';
import NinoClient from '../Client';

export default class AutoModSpam {
    public client: NinoClient;

    constructor(client: NinoClient) {
        this.client = client;
    }

    async handle(m: Message) {
        const queue = new RedisQueue(this.client.redis, `${m.author.id}:${(m.channel as TextChannel).guild.id}`); // go finish the command parser

    }
}