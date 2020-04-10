import { injectable, inject } from 'inversify';
import { humanize } from '../../util';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class UptimeCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'uptime',
      description: 'Gives you the uptime for the bot.',
      aliases: ['up'],
      category: 'Generic',
      ownerOnly: false,
    });
  }

  async run(ctx: Context) {
    return ctx.send(`:gear: **${humanize(Date.now() - this.bot.client.startTime)}**`);
  }
}