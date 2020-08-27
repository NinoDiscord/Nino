import Bot from '../Bot';
import { Punishment, PunishmentType } from '../services/PunishmentService';
import { Guild } from 'eris';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import { setTimeout } from 'long-timeout';
import ms from 'ms';

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
    // Look, I know it's horrendous but I think setTimeouts bleed into multiple executions 
    // when using it asynchronously, but who knows O_o
    //
    // 2 days later -- I standed correctly, it does bleed into a lot of executions
    // i.e: the bigger the timeout, the more spam it'll cause, so this is a patch for now
    
    setTimeout(() => {
      this.bot.redis.hexists('timeouts', key)
        .then((exists) => {
          if (exists) {
            this.bot.logger.info(`Timeouts: Exists for key "${key}", now doing task ${task}...`);
            this.bot.punishments.punish(
              { id: member, guild }, 
              new Punishment(task as PunishmentType, { moderator: this.bot.client.user }),
              '[Automod] Time\'s up!'
            )
              .then(() => this.bot.logger.info(`Timeouts: Did task "${task}" on member ${member}`))
              .catch(this.bot.logger.error)
              .finally(async () => {
                this.bot.logger.info('Timeouts: Done everything for timeout');
                await this.bot.redis.hdel('timeouts', key);
              });
          }
        })
        .catch(this.bot.logger.error);
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
    this.bot.logger.info(`Added timeout: to ${task} in ${ms(time)}`);
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
