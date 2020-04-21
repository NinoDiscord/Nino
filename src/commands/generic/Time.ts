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
    let date_Ob = new Date();
    let date = ("0" + date_Ob.getDate()).slice(-2);
    let month = ("0" + (date_Ob.getMonth() + 1)).slice(-2);
    let year = date_Ob.getFullYear();
    let hours = date_Ob.getHours();
    let minutes = date_Ob.getMinutes();
    let seconds = date_Ob.getSeconds();
    return ctx.send(`It is ${date}/${month}/${year} at ${hours}h ${minutes}m ${seconds}s`);
  }
}
