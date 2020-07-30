import Bot from '../Bot';
import { Punishment, PunishmentType } from './PunishmentManager';
import { Guild } from 'eris';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import { bigTimeout } from '../../util';

/**
 * This class makes timeouts resilent, automatic unmutes and unbans will be supported even on an event of a crash.
 *
 * @remarks
 * Saves the data in redis so it can be invoked later.
 */
@injectable()
export default class TimeoutsManager {
  private bot: Bot;

  constructor(@inject(TYPES.Bot) bot: Bot) {
    this.bot = bot;
  }

  private createTimeout(key: string, task: string, member: string, guild: Guild, time: number) {
    return bigTimeout(async () => {
      if (await this.bot.redis.hexists('timeouts', key)) {
        try {
          await this.bot.punishments.punish(
            { id: member, guild },
            new Punishment(task as PunishmentType, {
              moderator: this.bot.client.user,
            }),
            '[Automod] Time\'s up!'
          );
        } finally {
          await this.bot.redis.hdel('timeouts', key);
        }
      }
    }, time);
  }

  /**
   * Create a timeout
   * @param member the member
   * @param guild the guild
   * @param task the punishment
   * @param time the amount of time before executing
   */
  async addTimeout(member: string, guild: Guild, task: 'unban' | 'unmute', time: number) {
    const key = `timeout:${task}:${guild.id}:${member}`;
    await this.bot.redis.hset('timeouts', key, `${Date.now()}:${time}:${member}:${guild.id}:${task}`);
    this.createTimeout(key, task, member, guild, time);
  }

  /**
   * Cancel a timeout
   * @param member the member
   * @param guild the guild
   * @param task the punishment
   */
  async cancelTimeout(member: string, guild: Guild, task: string) {
    const key = `timeout:${task}:${guild.id}:${member}`;
    return this.bot.redis.hdel('timeouts', key);
  }

  private async resetOldTimeouts() {
    const oldtimedates = await this.bot.redis.keys('timeout:*:*:*');

    for (let timedate of oldtimedates) {
      const value = await this.bot.redis.get(timedate);
      await this.bot.redis.del(timedate);
      await this.bot.redis.hset('timeouts', timedate, value!);
    }
  }

  /**
   * Reapply timeouts since server went dead
   */
  async reapplyTimeouts() {
    await this.resetOldTimeouts();
    const timedates = await this.bot.redis.hkeys('timeouts');
    
    for (let timedate of timedates) {
      const value = await this.bot.redis.hget('timeouts', timedate);
      const start = Number(value!.split(':')[0]);
      const amount = Number(value!.split(':')[1]);
      const member = value!.split(':')[2];
      const guild = this.bot.client.guilds.get(value!.split(':')[3]);
      const task = value!.split(':')[4];
      if (!guild) continue;
      
      this.createTimeout(timedate, task, member, guild, start - Date.now() + amount);
    }
  }
}
