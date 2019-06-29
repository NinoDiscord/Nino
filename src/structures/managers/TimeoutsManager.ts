import NinoClient from '../Client';
import { Punishment, PunishmentType } from './PunishmentManager';
import { Guild, User, Member } from 'eris';

/**
 * This class makes timeouts resilent, automatic unmutes and unbans will be supported even on an event of a crash.
 * 
 * @remarks
 * Saves the data in redis so it can be invoked later.
 */
export default class TimeoutsManager {

    private client: NinoClient;

    constructor(client: NinoClient) {
        this.client = client;
    }

    /**
     * Create a timeout
     * @param member the member
     * @param guild the guild
     * @param task the punishment
     * @param time the amount of time before executing
     */
    async addTimeout(member: string, guild: Guild, task: string, time: number) {
        const key = `Timeout:${task}:${Date.now()}:${time}`;
        await this.client.redis.set(key, `${Date.now()}:${time}:${member}:${guild.id}:${task}`);
        setTimeout(async () => {
            await this.client.punishments.punish({id: member, guild}, new Punishment(task as PunishmentType, {moderator: this.client.user}), 'time\'s up');
            await this.client.redis.del(key);
        }, time)
    }

    /**
     * Reapply timeouts since server went dead
     */
    async reapplyTimeouts() {
        const timedates = await this.client.redis.keys('Timeout:*:*:*');
        for (let timedate of timedates) {
            const value = await this.client.redis.get(timedate);
            this.client.logger.info(value!.split(':'))
            const start = Number(value!.split(':')[0]);
            const amount = Number(value!.split(':')[1]);
            const member = value!.split(':')[2];
            const guild = await this.client.guilds.get(value!.split(':')[3]);
            const task = value!.split(':')[4]
            if (!guild)
                continue;
            
            setTimeout(async () => {
                await this.client.punishments.punish({id: member, guild}, new Punishment(task as PunishmentType, {moderator: this.client.user}), 'time\'s up');
                await this.client.redis.del(timedate);
            }, start - Date.now() + amount);

        }
    }

}