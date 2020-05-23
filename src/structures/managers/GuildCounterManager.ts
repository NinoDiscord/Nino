// this doesnt do anything, pls ignore it'll be in future release
import { injectable, inject } from 'inversify';
import RedisBucket from '../../util/RedisQueue';
import { TYPES } from '../../types';
import Nino from '../Bot';

@injectable()
export default class GuildCounterManager {
  public pool: RedisBucket;
  public bot: Nino;

  constructor(@inject(TYPES.Bot) bot: Nino) {
    this.pool = new RedisBucket(bot.redis, 'guild:counter');
    this.bot  = bot;
  }

  private getDate() {
    const now = new Date();
    return `${now.getMonth()}/${now.getDate()}/${now.getFullYear()}`;
  }

  async increment() {
    const key = this.getDate();
    await this.pool.push(key);

    
  }
}