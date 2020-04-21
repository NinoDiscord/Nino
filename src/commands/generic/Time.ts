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
      description: 'Tells you what day it is and what's the time.',
      aliases: ['when', 'day'],
      category: 'Generic',
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    ctx.send(`It is ${date}/${month}/${year} at ${hours}h ${minutes}m ${seconds}s`)
  }
}
