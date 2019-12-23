import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import 'reflect-metadata';
import Bot from '../Bot';

/**
 * This class assists in updating the status of the bot in real time.
 * 
 * @remarks
 * The pattern style:
 * %prefix% is replaced by the default prefix.
 * %guilds% is replaced by the number of guilds.
 */
@injectable()
export default class StatusManager {
  public bot: Bot;
  public pattern: string;

  constructor(@inject(TYPES.Bot) bot: Bot) {
    this.bot = bot;
    this.pattern = bot.config.status || '%prefix%help | %guilds% Guilds';
  }

  /*
        Updates the status of the bot.
    */
  updateStatus(): void {
    return this.bot.client.editStatus('online', {
      name: this.pattern
        .replace('%prefix%', this.bot.config['discord'].prefix)
        .replace('%guilds%', this.bot.client.guilds.size.toLocaleString()),
      type: 0,
    });
  }
}
