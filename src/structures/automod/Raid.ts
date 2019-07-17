import { Message, TextChannel, Member } from 'eris';
import RedisQueue from '../../util/RedisQueue';
import NinoClient from '../Client';
import PermissionUtils from '../../util/PermissionUtils';
import { Punishment, PunishmentType } from '../managers/PunishmentManager';

/**
 * An event handler to check for ongoing spam.
 * 
 * @remarks
 * The method used is a queue with message timestamps, it checks if there are over 5 messages in 3 seconds.
 * 5 messages - the length of the queue is 5
 * 3 seconds  - the difference between the first ban in the queue (newest) and the last one (oldest) is below 3000 milliseconds.
 * It auto evacuates ban timestamps so no old messages will be kept. 
 */
export default class AutoModRaid {
    public client: NinoClient;

    constructor(client: NinoClient) {
        this.client = client;
    }

    /**
     * Handles a message event, if there is an ongoing spam and the bot has the correct permissions, it warns the user.
     * Returns whether the event was handled
     * 
     * @remarks
     * To react it needs to be above a user in the heirarchy.
     * 
     * @param m the message
     */
    async handle(m: Member): Promise<boolean> {
        const guild = m.guild;
        const me = guild.members.get(this.client.user.id)!;
        if (!PermissionUtils.above(me, m) || m.bot)
            return false;

        const settings = await this.client.settings.get(guild.id);
        
        if (!settings || !settings.automod.raid) return false;

        const queue = new RedisQueue(this.client.redis, `raid:${guild.id}`);
        await queue.push(Date.now().toString());

        if ((await queue.length()) >= 3) {
            const oldtime = Number.parseInt(await queue.pop());
            
            if (Date.now() - oldtime <= 1000) {
                await this.client.punishments.punish(m, new Punishment(PunishmentType.Ban, {moderator: me.user}), 'Automod: Raid detected');
                return true;
            }
        }
        return false;
    }
}