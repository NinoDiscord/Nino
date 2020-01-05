import {
  Punishment,
  PunishmentType,
} from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import Bot from '../../structures/Bot';
import { findId } from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class UnbanCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'unban',
      description: 'Unbans a user from a guild',
      usage: '<user> <reason> [--reason]',
      aliases: ['unbanne'],
      category: 'Moderation',
      guildOnly: true,
      userpermissions: Constants.Permissions.banMembers,
      botpermissions: Constants.Permissions.banMembers,
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0))
      return ctx.send('Sorry but you will need to specify a user.');

    const id = findId(ctx.args.get(0));

    if (!id)
      return ctx.send('Please type the id or mention the user (<@id>/<@!id>)');

    if (!(await ctx.guild!.getBans()).find(v => v.user.id === id))
      return ctx.send('The user is not banned from this guild.');

    const reason = ctx.args.has(1) ? ctx.args.slice(1).join(' ') : undefined;
    await this.bot.timeouts.cancelTimeout(id, ctx.guild!, 'unban');

    const punishment = new Punishment(PunishmentType.Unban, {
      moderator: ctx.sender,
    });
    try {
      await this.bot.punishments.punish(
        { id, guild: ctx.guild! },
        punishment,
        reason
      );
      await ctx.send('User successfully unbanned.');
    }
    catch (e) {
      ctx.send('Cannot unban user, ' + e.message);
    }
  }
}
