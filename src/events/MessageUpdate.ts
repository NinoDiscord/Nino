import { Message } from 'eris';
import Client from '../structures/Client';
import Event from '../structures/Event';

export default class MessageUpdatedEvent extends Event {
    constructor(client: Client) {
        super(client, 'messageUpdate');
    }

    async emit(m: Message) {
        this.client.autoModService.handleMessage(m);
    }
}