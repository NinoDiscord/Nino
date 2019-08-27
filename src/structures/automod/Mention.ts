import { Message, TextChannel } from 'eris';
import PermissionUtil from '../../util/PermissionUtils';
import NinoClient from '../Client';
import RedisQueue from '../../util/RedisQueue';

export default class MentionSpam {
    public client: NinoClient;
    constructor(client: NinoClient) {
        this.client = client;
    }

    async handle(m: Message): Promise<boolean> {
        const channel = (m.channel as TextChannel);
        const nino = channel.guild.members.get(this.client.user.id)!;

        if (!PermissionUtil.above(nino, m.member!)) return false;

        const settings = await this.client.settings.get(channel.guild.id);
        if (!settings || !settings.automod.mention) return false;

        const queue = new RedisQueue(this.client.redis, `${m.author.id}:${channel.guild.id}`);
        // dondish: find a way around this... :<
        await queue.push(m.mentions[0].username);    

        // also fix this, I know it's messy :pensive:
        if ((await queue.length()) >= 5) {
            const old = parseInt(await queue.pop());
            if (m.mentions.length <= 7) {
                let punishment = await this.client.punishments.addWarning(m.member!);
                for (let punish of punishment) await this.client.punishments.punish(m.member!, punish, 'Automod');
                await m.channel.createMessage('Please don\'t mention spam.');
                return true;
            }
        }

        return false;
    }
}