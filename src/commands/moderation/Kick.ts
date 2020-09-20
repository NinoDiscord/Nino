import { Punishment, PunishmentType } from '../../structures/services/PunishmentService';
import { injectable, inject } from 'inversify';
import { Constants, Member } from 'eris';
import PermissionUtils from '../../util/PermissionUtils';
import { Module } from '../../util';
import { TYPES } from '../../types';
import findUser from '../../util/UserUtil'; 
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class KickCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'kick',
      description: 'Kicks a user from the guild',
      usage: '<user> <reason> [--reason]',
      aliases: ['boot', 'yeet'],
      category: Module.Moderation,
      guildOnly: true,
      botPermissions: Constants.Permissions.kickMembers,
      userPermissions: Constants.Permissions.kickMembers
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.sendTranslate('global.noUser');

    const userID = ctx.args.get(0);
    const user = findUser(this.bot, userID);
    if (!user || user === undefined) return ctx.sendTranslate('global.unableToFind');

    const member = ctx.guild!.members.get(user.id);
    if (!member) return ctx.sendTranslate('commands.moderation.notInGuild', {
      user: `${user.username}#${user.discriminator}`
    });

    if (!PermissionUtils.above(ctx.member!, member)) return ctx.sendTranslate('global.hierarchy');
    else if (!PermissionUtils.above(ctx.me!, member)) return ctx.sendTranslate('global.botHierarchy');
    else if (member.permission.has('banMembers')) return ctx.sendTranslate('global.banMods');

    const reason = ctx.args.has(1) ? ctx.args.slice(1).join(' ') : undefined;
    const punishment = new Punishment(PunishmentType.Kick, {
      moderator: ctx.sender
    });

    try {
      await this.bot.punishments.punish(member!, punishment, reason);

      const prefix = member instanceof Member ? member.user.bot ? 'Bot' : 'User' : 'User';
      return ctx.sendTranslate('commands.moderation.kick', {
        type: prefix
      });
    } catch(e) {
      return ctx.sendTranslate('commands.moderation.unable', {
        type: member instanceof Member ? member.user.bot ? 'bot' : 'user' : 'user',
        message: e.message
      });
    }
  }
}
