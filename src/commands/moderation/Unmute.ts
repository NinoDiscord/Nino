import {
  Punishment,
  PunishmentType,
} from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import Bot from '../../structures/Bot';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class UnmuteCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'unmute',
      description: 'Unmutes a user from a guild',
      usage: '<user> <reason> [--reason]',
      category: 'Moderation',
      guildOnly: true,
      userpermissions: Constants.Permissions.manageRoles,
      botpermissions:
        Constants.Permissions.manageRoles |
        Constants.Permissions.manageChannels,
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('You need to specify a user.');

    const u = findUser(this.bot, ctx.args.get(0))!;
    if (!u) return ctx.send("I can't find this user!");

    const member = ctx.guild!.members.get(u.id);

    if (!member || member === null)
      return ctx.send(
        `User \`${u.username}#${u.discriminator}\` is not in this guild?`
      );

    let reason =
      ctx.flags.get('reason') || ctx.flags.get('r') || ctx.args.has(1)
        ? ctx.args.slice(1).join(' ')
        : false;
    if (reason && typeof reason === 'boolean')
      return ctx.send('You will need to specify a reason');

    await this.bot.timeouts.cancelTimeout(member.id, ctx.guild!, 'unmute');
    const punishment = new Punishment(PunishmentType.Unmute, {
      moderator: ctx.sender,
    });
    try {
      await this.bot.punishments.punish(
        member!,
        punishment,
        reason as string | undefined
      );
      await ctx.send('User successfully unmuted.');
    } catch (e) {
      ctx.send('Cannot unmute user, ' + e.message);
    }
  }
}
