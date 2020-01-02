import {
  Punishment,
  PunishmentType,
} from '../../structures/managers/PunishmentManager';
import { Constants, Member, Guild } from 'eris';
import Bot from '../../structures/Bot';
import findUser, { findId } from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import ms = require('ms');
import PermissionUtils from '../../util/PermissionUtils';
import { Exception } from '@sentry/node';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class BanCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'ban',
      description: 'Ban a member in the current guild',
      usage: '<user> <reason> [--soft] [--days]',
      aliases: ['banne', 'bean'],
      category: 'Moderation',
      guildOnly: true,
      userpermissions: Constants.Permissions.banMembers,
      botpermissions: Constants.Permissions.banMembers,
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('You need to specify a user.');

    const u = findId(ctx.args.get(0));
    if (!u) return ctx.send('Invalid format: <@mention> / <user id>');
    let member:
      | Member
      | undefined
      | { id: string; guild: Guild } = ctx.guild!.members.get(u);

    if (!member || !(member instanceof Member))
      member = { id: u, guild: ctx.guild! };
    else {
      if (!PermissionUtils.above(ctx.message.member!, member))
        return ctx.send('The user is above you in the heirarchy.');
    }

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

    const days = ctx.flags.get('days') || ctx.flags.get('d');
    if (days && (typeof days === 'boolean' || !/[0-9]+/.test(days)))
      return ctx.send(
        'You need to specify the amount days to delete messages of.'
      );

    const t = !!time ? ms(time) : undefined;

    const punishment = new Punishment(PunishmentType.Ban, {
      moderator: ctx.sender,
      soft: ctx.flags.get('soft') as boolean,
      temp: t,
      days: Number(days),
    });

    try {
      await this.bot.punishments.punish(member!, punishment, reason);
      await ctx.send('User successfully banned.');
    } catch (e) {
      ctx.send('Cannot ban user, ' + e.message);
    }
  }
}
