import { Message } from 'eris';
import NinoClient from '../Client';

export default class AutoModInvite {
    public client: NinoClient;
    private regex: RegExp = /https:\/\/discord.gg\/\w+/;

    constructor(client: NinoClient) {
        this.client = client;
    }

    async handle(m: Message) {
        
    }
}