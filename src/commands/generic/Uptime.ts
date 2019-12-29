import { humanize } from '../../util';
import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class UptimeCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'uptime',
      description: 'Gives you the uptime for the bot.',
      aliases: ['up'],
      category: 'Generic',
      ownerOnly: false,
    });
  }

  async run(ctx: Context) {
    return ctx.send(humanize(Date.now() - ctx.client.startTime));
  }
}
