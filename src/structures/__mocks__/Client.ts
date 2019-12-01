import EmbedBuilder from '../EmbedBuilder';
import { Client } from 'eris';
import { NinoConfig } from '../Client';

export default class NinoClient extends Client {
    public p
    public owners: string[] = ['239790360728043520']; // note for dondish: make this a config setting

    constructor(config: NinoConfig) {
        super('', {
            maxShards: 'auto',
            disableEveryone: true,
            getAllUsers: true,
            restMode: true
        });
    }

    getEmbed() {
        return new EmbedBuilder()
            .setColor(0x6D6D99);
    }
}