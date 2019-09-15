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
     * The setTimeout function for big time values.
     * @param func the function to execute
     * @param time the time to excute it after
     */
    bigTimeout(func: (...args: any[]) => void, time: number) {
        if (time > 0x7FFFFFFF) {
            setTimeout(() => this.bigTimeout(func, time - 0x7FFFFFFF), 0x7FFFFFFF);
        } else {
            setTimeout(func, time);
        }
    }

    /**
     * Create a timeout
     * @param member the member
     * @param guild the guild
     * @param task the punishment
     * @param time the amount of time before executing
     */
    async addTimeout(member: string, guild: Guild, task: string, time: number) {
        const key = `Timeout:${task}:${guild.id}:${member}`;
        await this.client.redis.set(key, `${Date.now()}:${time}:${member}:${guild.id}:${task}`);
        this.bigTimeout(async () => {
            if (await this.client.redis.exists(key)) {
                await this.client.punishments.punish({id: member, guild}, new Punishment(task as PunishmentType, {moderator: this.client.user}), 'time\'s up');
                await this.client.redis.del(key);
            }
            
        }, time);
    }

    /**
     * Cancel a timeout
     * @param member the member
     * @param guild the guild
     * @param task the punishment
     */
    async cancelTimeout(member: string, guild: Guild, task: string) {
        const key = `Timeout:${task}:${guild.id}:${member}`;
        return this.client.redis.del(key);
    }

    /**
     * Reapply timeouts since server went dead
     */
    async reapplyTimeouts() {
        const timedates = await this.client.redis.keys('Timeout:*:*:*');
        for (let timedate of timedates) {
            const value = await this.client.redis.get(timedate);
            const start = Number(value!.split(':')[0]);
            const amount = Number(value!.split(':')[1]);
            const member = value!.split(':')[2];
            const guild = await this.client.guilds.get(value!.split(':')[3]);
            const task = value!.split(':')[4];
            if (!guild)
                continue;
            
            this.bigTimeout(async () => {
                if (await this.client.redis.exists(timedate)) {
                    await this.client.punishments.punish({id: member, guild}, new Punishment(task as PunishmentType, {moderator: this.client.user}), 'time\'s up');
                    await this.client.redis.del(timedate);
                }
            }, start - Date.now() + amount);

        }
    }

}