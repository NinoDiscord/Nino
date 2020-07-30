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

  /**
   * Create a timeout
   * @param member the member
   * @param guild the guild
   * @param task the punishment
   * @param time the amount of time before executing
   */
  async addTimeout(member: string, guild: Guild, task: 'unban' | 'unmute', time: number) {
    const key = `timeout:${task}:${guild.id}:${member}`;
    await this.bot.redis.set(key, `${Date.now()}:${time}:${member}:${guild.id}:${task}`);
    bigTimeout(async () => {
      const exists = await this.bot.redis.exists(key);
      if (exists) {
        const punishment = new Punishment(task as PunishmentType, {
          moderator: this.bot.client.user
        });
        await this.bot.punishments.punish({ id: member, guild }, punishment, '[Automod] Time\'s up!');
        await this.bot.redis.del(key);
      }
    }, BigInt(time));
  }

  /**
   * Cancel a timeout
   * @param member the member
   * @param guild the guild
   * @param task the punishment
   */
  async cancelTimeout(member: string, guild: Guild, task: string) {
    const key = `timeout:${task}:${guild.id}:${member}`;
    return this.bot.redis.del(key);
  }

  /**
   * Reapply timeouts since server went dead
   */
  async reapplyTimeouts() {
    const timedates = await this.bot.redis.keys('timeout:*:*:*');
    for (let timedate of timedates) {
      const value = await this.bot.redis.get(timedate);
      const start = Number(value!.split(':')[0]);
      const amount = Number(value!.split(':')[1]);
      const member = value!.split(':')[2];
      const guild = this.bot.client.guilds.get(value!.split(':')[3]);
      const task = value!.split(':')[4];
      if (!guild) continue;

      bigTimeout(async () => {
        if (await this.bot.redis.exists(timedate)) {
          try {
            await this.bot.punishments.punish(
              { id: member, guild },
              new Punishment(task as PunishmentType, {
                moderator: this.bot.client.user,
              }),
              '[Automod] Time\'s up!'
            );
          } finally {
            await this.bot.redis.del(timedate);
          }
        }
      }, BigInt(start - Date.now() + amount));
    }
  }
}
