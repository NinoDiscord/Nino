import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class TimeCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'time',
      description: 'Tells you what day it is and what\'s the time.',
      aliases: ['when', 'day'],
      category: 'Generic',
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    const date = new Date();
    const convert = (t: any) => `0${t}`.slice(-2);
    const translated = (await ctx.getLocale()).translate('commands.generic.time', {
      days: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      hours: convert(date.getHours()),
      minutes: convert(date.getMinutes()),
      seconds: convert(date.getSeconds())
    });

    return ctx.send(translated);
  }
}
