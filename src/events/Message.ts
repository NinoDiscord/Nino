import { Message } from 'eris';
import Client from '../structures/Client';
import Event from '../structures/Event';

export default class MessageReceivedEvent extends Event {
    constructor(client: Client) {
        super(client, 'messageCreate');
    }

    async emit(m: Message) {
        this.client.manager.service.handle(m);
    }
}