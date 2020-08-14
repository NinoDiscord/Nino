import { injectable, inject } from 'inversify';
import { Constants } from 'eris';
import { Module } from '../../util';
import { TYPES } from '../../types';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import PermissionUtils from '../../util/PermissionUtils';
import WarningService from '../../structures/services/WarningService';
import PunishmentService from '../../structures/services/PunishmentService';

@injectable()
export default class WarnCommand extends Command {
  constructor(
      @inject(TYPES.Bot) bot: Bot,
      @inject(TYPES.WarningService) private warningService: WarningService,
      @inject(TYPES.PunishmentService) private punishmentService: PunishmentService) {
    super(bot, {
      name: 'warn',
      description: 'Warns a member from this guild',
      usage: '<user>',
      aliases: ['addwarn'],
      category: Module.Moderation,
      userPermissions: Constants.Permissions.kickMembers,
      botPermissions: Constants.Permissions.kickMembers,
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.sendTranslate('global.noUser');

    const userID = ctx.args.get(0);
    const u = findUser(this.bot, userID);
    if (!u) return ctx.sendTranslate('global.unableToFind');

    const member = ctx.guild!.members.get(u.id);
    if (!member) return ctx.sendTranslate('commands.moderation.notInGuild', {
      user: `${u.username}#${u.discriminator}`
    });

    
    if (!PermissionUtils.above(ctx.member!, member)) return ctx.sendTranslate('global.hierarchy');
    else if (!PermissionUtils.above(ctx.me, member)) return ctx.sendTranslate('global.botHierarchy');

    const punishments = await this.punishmentService.addWarning(member!);
    for (let i of punishments) {
      try {
        await this.punishmentService.punish(member!, i, '[Automod] Moderator warned user');
      } catch (e) {
        return ctx.sendTranslate('global.unable', { error: e.message });
      }
    }

    const warns = await this.warningService.get(ctx.guild!.id, member.id);
    return ctx.sendTranslate('commands.moderation.warned', {
      warnings: warns === null ? 1 : warns.amount,
      suffix: warns === null ? '' : warns.amount > 1 ? 's' : '',
      user: `${member.username}#${member.discriminator}`
    });
  }
}
