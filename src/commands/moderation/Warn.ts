import { injectable, inject } from 'inversify';
import { Constants } from 'eris';
import findUser from '../../util/UserUtil';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class WarnCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'warn',
      description: 'Warns a member from this guild',
      usage: '<user>',
      aliases: ['addwarn'],
      category: 'Moderation',
      userPermissions: Constants.Permissions.manageRoles,
      botPermissions: Constants.Permissions.manageRoles,
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    const locale = await ctx.getLocale();
    if (!ctx.args.has(0)) return ctx.send(locale.translate('global.noUser'));

    const userID = ctx.args.get(0);
    const u = findUser(this.bot, userID);
    if (!u || u === undefined) return ctx.send(locale.translate('global.unableToFind'));

    const member = ctx.guild!.members.get(u.id);
    if (!member) return ctx.send(locale.translate('commands.moderation.notInGuild', {
      user: `${u.username}#${u.discriminator}`
    }));

    const punishments = await this.bot.punishments.addWarning(member!);
    for (let i of punishments) {
      try {
        await this.bot.punishments.punish(member!, i, '[Automod] Moderator warned user');
      } catch (e) {
        return ctx.send(locale.translate('global.unable', { error: e.message }));
      }
    }

    const warns = await this.bot.warnings.get(ctx.guild!.id, member.id);
    const message = locale.translate('commands.moderation.warned', {
      warnings: warns === null ? 1 : warns.amount,
      suffix: warns === null ? '' : warns.amount > 1 ? 's' : '',
      user: `${member.username}#${member.discriminator}`
    });

    return ctx.send(message);
  }
}