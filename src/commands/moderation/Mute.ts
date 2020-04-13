import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { injectable, inject } from 'inversify';
import { Constants, Member } from 'eris';
import PermissionUtils from '../../util/PermissionUtils';
import { TYPES } from '../../types';
import findUser from '../../util/UserUtil'; 
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import ms = require('ms');

@injectable()
export default class MuteCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'mute',
      description: 'Mutes a member from this guild',
      usage: '<user> <reason> | [time]',
      aliases: ['slience'],
      category: 'Moderation',
      userPermissions: Constants.Permissions.manageRoles,
      botPermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels,
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('No user has been specified');

    const userID = ctx.args.get(0);
    const user = findUser(this.bot, userID);
    if (!user || user === undefined) return ctx.send('Cannot find member in this guild');

    const member = ctx.guild!.members.get(user.id);
    if (!member) return ctx.send(`User **\`${user.username}#${user.discriminator}\`** isn't in the guild`);
    if (!PermissionUtils.above(ctx.message.member!, member)) return ctx.send('The user is above or the same heirarchy as you');

    const baseReason = ctx.args.has(1) ? ctx.args.slice(1).join(' ') : undefined;
    let reason!: string;
    let time!: string;
  
    if (baseReason) {
      const sliced = baseReason.split(' | ');
      reason = sliced[0];
      time = sliced[1];
    }

    const t = time ? ms(time) : undefined;
    const punishment = new Punishment(PunishmentType.Mute, {
      moderator: ctx.sender,
      temp: t
    });

    await this.bot.timeouts.cancelTimeout(member.id, ctx.guild!, 'unmute');
    try {
      await this.bot.punishments.punish(member!, punishment, reason);

      const prefix = member instanceof Member ? member.user.bot ? 'Bot' : 'User' : 'User';
      return ctx.send(`${prefix} was successfully muted`);
    } catch (ex) {
      return ctx.send(`Unable to mute user: \`${ex.message}\``);
    }
  }
}