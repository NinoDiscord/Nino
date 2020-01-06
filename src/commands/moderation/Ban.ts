import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { Constants, Member, Guild } from 'eris';
import { injectable, inject } from 'inversify';
import PermissionUtils from '../../util/PermissionUtils';
import { findId } from '../../util/UserUtil'; 
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import ms = require('ms');

@injectable()
export default class BanCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'ban',
      description: 'Ban a member in the current guild',
      usage: '<user> <reason> [--soft] [--days]',
      aliases: ['banne', 'bean'],
      category: 'Moderation',
      guildOnly: true,
      userPermissions: Constants.Permissions.banMembers,
      botPermissions: Constants.Permissions.banMembers,
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('No user has been specified');

    const userID = ctx.args.get(0);
    const user = findId(userID);
    if (!user) return ctx.send('Unable to find that user. All users must be `<@mention>` or with a user ID');

    let member: Member | { id: string; guild: Guild } | undefined = ctx.guild!.members.get(user);
    if (!member || !(member instanceof Member)) member = { id: userID, guild: ctx.guild! };
    else {
      if (!PermissionUtils.above(ctx.member!, member)) return ctx.send('User is above or the same of your heirarchy');
    }

    const baseReason = ctx.args.has(1) ? ctx.args.slice(1).join(' ') : undefined;
    let reason!: string;
    let time!: string;

    if (baseReason) {
      const sliced = baseReason.split(' | ');
      reason = sliced[0];
      time = sliced[1];
    }

    const days = ctx.flags.get('days') || ctx.flags.get('d');
    if (days && (typeof days === 'boolean' || !(/[0-9]+/).test(days))) return ctx.send('You must need to specify an amount days to delete messages. (example: `--days=7`)');

    const t = time ? ms(time) : undefined;
    const soft = ctx.flags.get('soft');
    if (soft && typeof soft === 'string') return ctx.send('You don\'t need to append anything (example: `--soft`)');

    const punishment = new Punishment(PunishmentType.Ban, {
      moderator: ctx.sender,
      soft: soft as boolean,
      temp: t,
      days: Number(days)
    });

    try {
      await this.bot.punishments.punish(member!, punishment, reason);
      return ctx.send('User was successfully banned');
    }
    catch(e) {
      ctx.send(`Unable to ban user: \`${e.message}\``);
    }
  }
}