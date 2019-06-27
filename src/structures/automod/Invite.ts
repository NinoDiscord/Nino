import { Message, TextChannel } from 'eris';
import NinoClient from '../Client';
import PermissionUtils from '../../util/PermissionUtils';

export default class AutoModInvite {
    public client: NinoClient;
    private regex: RegExp = /http(s)?:\/\/(www.)?(discord.gg|discord.io|discord.me)\/\w+/;

    constructor(client: NinoClient) {
        this.client = client;
    }

    async handle(m: Message) {
        const guild = (m.channel as TextChannel).guild;
        const me = guild.members.get(this.client.user.id)!;
        if (!PermissionUtils.above(me, m.member!)) // TODO: add permission checks. I will need to figure out those!
            return;

        if (m.content.match(this.regex)) {
            const settings = await this.client.settings.get(guild.id);
        
            if (!settings || !settings.automod.invites) return;

            await m.channel.createMessage('HEY! NO ADS ALLOWED!')
        }
    }
}