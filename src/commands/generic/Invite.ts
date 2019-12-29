import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class InviteCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'invite',
      description: 'Gives you the invite for the bot.',
      aliases: ['inv'],
      category: 'Generic',
      ownerOnly: false,
    });
  }

  async run(ctx: Context) {
    return ctx.send(
      `:link: Here you go: <https://discordapp.com/oauth2/authorize?client_id=${ctx.me.id}&scope=bot>`
    );
  }
}
