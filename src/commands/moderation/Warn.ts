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
import PunishmentService, { Punishment, PunishmentType } from '../../structures/services/PunishmentService';

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
    const u = await findUser(this.bot, ctx.guild!.id, userID);
    if (!u) return ctx.sendTranslate('global.unableToFind');

    const member = ctx.guild!.members.get(u.id);
    if (!member) return ctx.sendTranslate('commands.moderation.notInGuild', {
      user: `${u.username}#${u.discriminator}`
    });
    
    if (member.user.id === ctx.guild!.ownerID) return ctx.sendTranslate('global.banOwner');
    if (member.user.id === this.bot.client.user.id) return ctx.sendTranslate('global.banSelf');
    if (!ctx.member!.permissions.has('administrator') && member.permission.has('banMembers')) return ctx.sendTranslate('global.banMods');
    if (!PermissionUtils.above(ctx.member!, member)) return ctx.sendTranslate('global.hierarchy');
    if (!PermissionUtils.above(ctx.me!, member)) return ctx.sendTranslate('global.botHierarchy');

    const reason = ctx.args.has(1) ? ctx.args.slice(1).join(' ') : undefined;
    const punishments = await this.punishmentService.addWarning(member!, reason);

    const addWarn = punishments.length > 0;
    for (let i of punishments) {
      try {
        await this.punishmentService.punish(member!, i, reason, true);
      } catch (e) {
        return ctx.sendTranslate('global.unable', { error: e.message });
      }
    }

    if (!addWarn) {
      await this.punishmentService.punish(member!, new Punishment(PunishmentType.AddWarning, {
        moderator: ctx.member!.user
      }), reason);
    }

    const warns = await this.warningService.get(ctx.guild!.id, member.id);
    const warnings = warns === null
      ? 1
      : addWarn
        ? warns.amount + 1
        : warns.amount;

    return ctx.sendTranslate('commands.moderation.warned', {
      warnings,
      suffix: warns === null ? '' : warns.amount > 1 ? 's' : '',
      user: `${member.username}#${member.discriminator}`,
      reason: reason === undefined ? '' : ` (*${reason}*)`
    });
  }
}
