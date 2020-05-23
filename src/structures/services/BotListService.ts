import Bot, { Config } from '../Bot';
import wumpfetch from 'wumpfetch';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

/**
 * Service that posts guild count to botlists.
 * @remarks
 * Posts every minute to all botlists.
 */
@injectable()
export default class BotListService {
  private bot: Bot;
  private interval?: NodeJS.Timeout;

  constructor(
    @inject(TYPES.Bot) bot: Bot
  ) {
    this.bot = bot;
  }

  /**
   * Start posting guild stats
   */
  start() {
    this.postCount(this.bot.client.guilds.size);
    this.interval = setInterval(async() => {
      const guilds = await this.bot.redis.get('guilds');
      if (guilds) this.postCount(Number(guilds));
    }, 60000);
  }

  /**
   * Stop posting guild stats
   */
  stop() {
    if (this.interval) this.interval.unref();
  }

  /**
   * Post guild stats
   */
  postCount(guilds: number) {
    if (!this.bot.config.botlists) return;
    if (this.bot.config.botlists.topggtoken) {
      wumpfetch({
        url: `https://top.gg/api/bots/${this.bot.client.user.id}/stats`,
        method: 'POST',
        data: {
          // eslint-disable-next-line camelcase
          server_count: guilds,
        },
      })
        .header({
          Authorization: this.bot.config.botlists.topggtoken,
          'Content-Type': 'application/json',
        })
        .send()
        .then(res => {
          this.bot.logger.info(`Posted guild stats to top.gg: ${res.statusCode}: ${res.body}`);
        })
        .catch(() => {
          this.bot.logger.error('Failed to post guild stats to top.gg');
        });
    }
    if (this.bot.config.botlists.bfdtoken) {
      wumpfetch({
        url: `https://botsfordiscord.com/api/bot/${this.bot.client.user.id}`,
        method: 'POST',
        data: {
          // eslint-disable-next-line camelcase
          server_count: guilds,
        },
      })
        .header({
          Authorization: this.bot.config.botlists.bfdtoken,
          'Content-Type': 'application/json',
        })
        .send()
        .then(res => {
          this.bot.logger.info(`Posted guild stats to Bots For Discord: ${res.statusCode}: ${res.body}`);
        })
        .catch(() => {
          this.bot.logger.error('Failed to post guild stats to Bots For Discord.');
        });
    }
    if (this.bot.config.botlists.dboatstoken) {
      wumpfetch({
        url: `https://discord.boats/api/bot/${this.bot.client.user.id}`,
        method: 'POST',
        data: {
          // eslint-disable-next-line camelcase
          server_count: guilds,
        },
      })
        .header({
          Authorization: this.bot.config.botlists.dboatstoken,
          'Content-Type': 'application/json',
        })
        .send()
        .then(res => {
          this.bot.logger.info(`Posted guild stats to Discord Boats: ${res.statusCode}: ${res.body}`);
        })
        .catch(() => {
          this.bot.logger.error('Failed to post guild stats to Discord Boats.');
        });
    }
    if (this.bot.config.botlists.blstoken) {
      wumpfetch({
        url: `https://api.botlist.space/v1/bots/${this.bot.client.user.id}`,
        method: 'POST',
        data: {
          // eslint-disable-next-line camelcase
          server_count: guilds,
        },
      })
        .header({
          Authorization: this.bot.config.botlists.blstoken,
          'Content-Type': 'application/json',
        })
        .send()
        .then(res => {
          this.bot.logger.info(`Posted guild stats to botlist.space: ${res.statusCode}: ${res.body}`);
        })
        .catch(() => {
          this.bot.logger.error('Failed to post guild stats to botlist.space.');
        });
    }
  }
}
