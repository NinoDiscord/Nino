import EmbedBuilder from "../EmbedBuilder";
import { Client } from "eris";

export default class NinoClient extends Client {
    public owners: string[] = ['239790360728043520'];

    constructor() {
        super("", {
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