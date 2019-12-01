import { Message, TextChannel } from 'eris';
import RedisQueue from '../../util/RedisQueue';
import Bot from '../Bot';
import PermissionUtils from '../../util/PermissionUtils';

/**
 * An event handler to check for ongoing spam.
 * 
 * @remarks
 * The method used is a queue with message timestamps, it checks if there are over 5 messages in 3 seconds.
 * 5 messages - the length of the queue is 5
 * 3 seconds  - the difference between the first message in the queue (newest) and the last one (oldest) is below 3000 milliseconds.
 * It auto evacuates message timestamps so no old messages will be kept. 
 */
export default class AutoModSpam {
    public bot: Bot;

    constructor(client: Bot) {
        this.bot = client;
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
    async handle(m: Message): Promise<boolean> {
        const guild = (m.channel as TextChannel).guild;
        const me = guild.members.get(this.bot.client.user.id)!;
        if (!PermissionUtils.above(me, m.member!) || m.author.bot || (m.channel as TextChannel).permissionsOf(m.author.id).has('manageMessages')) return false;

        const settings = await this.bot.settings.get(guild.id);

        if (!settings || !settings.automod.spam) return false;

        const queue = new RedisQueue(this.bot.redis, `${m.author.id}:${guild.id}`);
        await queue.push(m.timestamp.toString());

        if ((await queue.length()) >= 5) {
            const oldtime = Number.parseInt(await queue.pop());

            if (m.editedTimestamp && m.editedTimestamp > m.timestamp) return false; //remove the possibility for edits to be counted by checking if the message object has a greater edit timestamp than created timestamp
            if (m.timestamp - oldtime <= 3000) {
                let punishments = await this.bot.punishments.addWarning(m.member!);
                for (let punishment of punishments) await this.bot.punishments.punish(m.member!, punishment, 'Automod (Spamming)');
                await m.channel.createMessage('Stop right there! Spamming is not allowed!');
                return true;
            }
        }
        return false;

    }
}