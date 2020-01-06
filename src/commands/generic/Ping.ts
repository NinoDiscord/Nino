import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class PingCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'ping',
      description: 'Gives you the bot\'s ping.',
      aliases: ['pong', 'pang'],
      category: 'Generic',
      ownerOnly: false,
    });
  }

  async run(ctx: Context) {
    const startedAt = Date.now();
    const message = await ctx.send(':ping_pong: S-seems weird why you w-want it!');
    await message.delete();
    return ctx.send(`:ping_pong: Pong! \`${Date.now() - startedAt}ms\``);
  }
}
