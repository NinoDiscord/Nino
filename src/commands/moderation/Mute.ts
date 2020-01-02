import {
  Punishment,
  PunishmentType,
} from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import Bot from '../../structures/Bot';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import ms = require('ms');
import PermissionUtils from '../../util/PermissionUtils';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class MuteCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'mute',
      description: 'Mutes a member from this guild',
      usage: '<user> <reason> [--reason] [--time]',
      aliases: ['slience'],
      category: 'Moderation',
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

    if (!member)
      return ctx.send(
        `User \`${u.username}#${u.discriminator}\` is not in this guild?`
      );

    if (!PermissionUtils.above(ctx.message.member!, member))
      return ctx.send('The user is above you in the heirarchy.');

    const baseReason = ctx.args.has(1)
      ? ctx.args.slice(1).join(' ')
      : undefined;
    let time!: string;
    let reason!: string;

    if (baseReason) {
      const sliced = baseReason.split(' | ');
      reason = sliced[0];
      time = sliced[1];
    }

    const t = !!time ? ms(time) : undefined;
    const punishment = new Punishment(PunishmentType.Mute, {
      moderator: ctx.sender,
      temp: t,
    });

    await this.bot.timeouts.cancelTimeout(member.id, ctx.guild!, 'unmute');
    try {
      await this.bot.punishments.punish(member!, punishment, reason);
      await ctx.send('User successfully muted.');
    } catch (e) {
      ctx.send('Cannot mute user, ' + e.message);
    }
  }
}
