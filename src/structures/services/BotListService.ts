/* eslint-disable camelcase */
import { inject, injectable } from 'inversify';
import { Module } from '../../util';
import { TYPES } from '../../types';
import Bot from '../Bot';
import w from 'wumpfetch';

interface CommandArray {
  category: string;
  command: string;
  desc: string;
}

/**
 * Service that posts guild count to botlists.
 * @remarks
 * Posts every minute to all botlists.
 */
@injectable()
export default class BotListService {
  // We post the commands to discordservices.net, so this is just a way to see if we did
  private hasPostedCmds: boolean = false;
  private interval?: NodeJS.Timeout;
  private bot: Bot;

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
      if (guilds) await this.postCount(Number(guilds));
    }, 86400000);
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
  async postCount(guilds: number) {
    if (!this.bot.config.botlists) return;

    if (this.bot.config.botlists.hasOwnProperty('topggtoken')) {
      this.bot.logger.info('Found top.gg token, now posting...');
      const res = await w({
        method: 'POST',
        data: {
          server_count: guilds
        },
        url: `https://top.gg/api/bots/${this.bot.client.user.id}/stats`
      })
        .header({
          'Content-Type': 'application/json',
          Authorization: this.bot.config.botlists.topggtoken!
        })
        .send();

      const func = res.statusCode === 200 ? 'info' : 'warn';
      this.bot.logger[func](`Posted statistics to top.gg (${res.statusCode}): ${res.body}`);
    }

    if (this.bot.config.botlists.hasOwnProperty('bfdtoken')) {
      this.bot.logger.info('Found Bots for Discord token, now posting...');
      const res = await w({
        method: 'POST',
        data: {
          server_count: guilds
        },
        url: `https://botsfordiscord.com/api/bot/${this.bot.client.user.id}`
      })
        .header({
          'Content-Type': 'application/json',
          Authorization: this.bot.config.botlists.bfdtoken!
        })
        .send();

      const func = res.statusCode === 200 ? 'info' : 'warn';
      this.bot.logger[func](`Posted statistics to Bots for Discord (${res.statusCode}): ${res.body}`);
    }

    if (this.bot.config.botlists.hasOwnProperty('dboatstoken')) {
      this.bot.logger.info('Found Discord Boats token, now posting...');
      const res = await w({
        method: 'POST',
        data: {
          server_count: guilds
        },
        url: `https://discord.boats/api/v2/bot/${this.bot.client.user.id}`
      })
        .header({
          'Content-Type': 'application/json',
          Authorization: this.bot.config.botlists.dboatstoken!
        })
        .send();

      const func = res.statusCode === 200 ? 'info' : 'warn';
      this.bot.logger[func](`Posted statistics to Discord Boats (${res.statusCode}): ${res.body}`);
    }

    if (this.bot.config.botlists.hasOwnProperty('blstoken')) {
      this.bot.logger.info('Found botlist.space token, now posting...');
      const res = await w({
        method: 'POST',
        data: {
          server_count: guilds
        },
        url: `https://api.botlist.space/v1/bots/${this.bot.client.user.id}`,
      })
        .header({
          'Content-Type': 'application/json',
          Authorization: this.bot.config.botlists.blstoken!
        })
        .send();

      const func = res.statusCode === 200 ? 'info' : 'warn';
      this.bot.logger[func](`Posted statistics to botlist.space (${res.statusCode}): ${res.body}`);
    }

    if (this.bot.config.botlists.hasOwnProperty('dservicestoken')) {
      this.bot.logger.info('Found Discord Services token, now posting...');
      const res = await w({
        method: 'POST',
        data: {
          server_count: guilds
        },
        url: `https://api.discordservices.net/bot/${this.bot.client.user.id}/stats`,
      })
        .header({
          'Content-Type': 'application/json',
          Authorization: this.bot.config.botlists.dservicestoken!
        })
        .send();

      const func = res.statusCode === 200 ? 'info' : 'warn';
      this.bot.logger[func](`Posted statistics to Discord Services (${res.statusCode}): ${res.body}`);

      if (!this.hasPostedCmds) {
        const commands: CommandArray[] = [];
        for (const command of this.bot.manager.commands.values()) {
          // Don't post commands that only the owners can use
          if (command.category === Module.System) continue;

          commands.push({
            category: command.category,
            command: command.name,
            desc: command.description
          });
        }

        const res = await w({
          method: 'POST',
          url: `https://api.discordservices.net/bot/${this.bot.client.user.id}/commands`,
          data: commands
        }).header({
          'Content-Type': 'application/json',
          Authorization: this.bot.config.botlists.dservicestoken!
        }).send();

        const func = res.statusCode === 200 ? 'info' : 'warn';
        this.bot.logger[func](`Posted command statistics to Discord Services (${res.statusCode}): ${res.body}`);
        this.hasPostedCmds = true;
      }
    }

    if (this.bot.config.botlists.hasOwnProperty('deltoken')) {
      this.bot.logger.info('Now posting statistics to Discord Extreme List'); // btw ice is a cutie - augu

      const res = await w({
        method: 'POST',
        url: `https://api.discordextremelist.xyz/v2/bot/${this.bot.client.user.id}/stats`,
        data: {
          guildCount: this.bot.client.guilds.size,
          shardCount: this.bot.client.shards.size
        }
      })
        .header({
          'Content-Type': 'application/json',
          Authorization: this.bot.config.botlists.deltoken!
        })
        .send();

      const func = res.statusCode === 200 ? 'info' : 'warn';
      this.bot.logger[func](`Posted statistics to Discord Extreme List (${res.statusCode}): ${res.body}`);
    }
  }
}
