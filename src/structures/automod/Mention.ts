import { Message, TextChannel } from 'eris';
import PermissionUtil from '../../util/PermissionUtils';
import NinoClient from '../Client';

export default class AutoModMention {
    public client: NinoClient;
    constructor(client: NinoClient) {
        this.client = client;
    }

    async handle(m: Message): Promise<boolean> {
        const channel = (m.channel as TextChannel);
        const nino = channel.guild.members.get(this.client.user.id)!;

        if (!PermissionUtil.above(nino, m.member!) || m.member!.permission.has('manageMessages')) return false;

        const settings = await this.client.settings.get(channel.guild.id);
        if (!settings || !settings.automod.mention) return false;

        
        if (m.mentions.length >= 4) {
            let punishment = await this.client.punishments.addWarning(m.member!);
            for (let punish of punishment) await this.client.punishments.punish(m.member!, punish, 'Automod');
            await m.channel.createMessage(`${m.member!.mention}, Please don't mention spam.`);
            return true;
        }

        return false;
    }
}