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
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    const date = new Date();
    const convert = (t: any) => `0${t}`.slice(-2);
    return ctx.sendTranslate('commands.generic.time', {
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      h: convert(date.getHours()),
      m: convert(date.getMinutes()),
      s: convert(date.getSeconds())
    });
  }
}
