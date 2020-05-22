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
    let dateOb = new Date();
    let date = ('0' + dateOb.getDate()).slice(-2);
    let month = ('0' + (dateOb.getMonth() + 1)).slice(-2);
    let year = dateOb.getFullYear();
    let hours = dateOb.getHours();
    let minutes = dateOb.getMinutes();
    let seconds = dateOb.getSeconds();
    return ctx.send(`It is ${date}/${month}/${year} at ${hours}h ${minutes}m ${seconds}s`);
  }
}
