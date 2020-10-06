import Bot from '../Bot';
import { Punishment, PunishmentType } from '../services/PunishmentService';
import { Collection } from '@augu/immutable';
import { Guild } from 'eris';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import { setTimeout, Timeout } from 'long-timeout';
import ms from 'ms';

/**
 * This class makes timeouts resilent, automatic unmutes and unbans will be supported even on an event of a crash.
 *
 * @remarks
 * Saves the data in redis so it can be invoked later.
 */
@injectable()
export default class TimeoutsManager {
  private timeouts: Collection<Timeout>;
  private bot: Bot;

  constructor(@inject(TYPES.Bot) bot: Bot) {
    this.timeouts = new Collection();
    this.bot      = bot;
  }

  private createTimeout(key: string, task: string, member: string, guild: Guild, time: number) {
    this.bot.logger.debug(`Called TimeoutsManager.createTimeout(${key}, ${task}, ${member}, ${guild.id}, ${time})`);
    const timeout = setTimeout(() => {
      this.bot.redis.hexists('timeouts', key)
        .then((exists) => {
          if (exists && this.timeouts.has(key)) {
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
                await this.cancelTimeout(member, guild, task);
              });
          }
        })
        .catch(this.bot.logger.error);
    }, time);

    if (this.timeouts.has(key)) {
      this.bot.logger.debug(`Existing timeout already exists for "${key}", closing...`);
      const old = this.timeouts.get(key)!;
      old.close();
    }

    timeout.unref();
    this.timeouts.set(key, timeout);
    this.bot.logger.debug(`Appended timeout for member "${member}" in guild "${guild.name}" for ${time}.`);
  }

  /**
   * Create a timeout
   * @param member the member
   * @param guild the guild
   * @param task the punishment
   * @param time the amount of time before executing
   */
  async addTimeout(member: string, guild: Guild, task: 'unban' | 'unmute', time: number) {
    this.bot.logger.debug(`Called TimeoutsManager.addTimeout(${member}, ${guild.id}, ${task}, ${time})`);
    const key = `timeout:${task}:${guild.id}:${member}`;

    if (!(await this.hasTimeout(member, guild, task)))
      await this.bot.redis.hset('timeouts', key, `${Date.now()}:${time}:${member}:${guild.id}:${task}`);

    this.createTimeout(key, task, member, guild, time);
  }

  /**
   * Checks if a timeout is existant
   * @param member The member
   * @param guild The guild
   * @param task The task
   */
  hasTimeout(member: string, guild: Guild, task: 'unban' | 'unmute') {
    return this.bot.redis.hexists('timeouts', `timeout:${task}:${guild.id}:${member}`);
  }

  /**
   * Cancel a timeout
   * @param member the member
   * @param guild the guild
   * @param task the punishment
   */
  async cancelTimeout(member: string, guild: Guild, task: string) {
    this.bot.logger.debug(`Called TimeoutsManager.cancelTimeout(${member}, ${guild.id}, ${task})`);
    const key = `timeout:${task}:${guild.id}:${member}`;
    if (this.timeouts.has(key)) {
      const timeout = this.timeouts.get(key)!;
      timeout.close();

      this.timeouts.delete(key);
    }

    await this.bot.redis.hdel('timeouts', key);
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
