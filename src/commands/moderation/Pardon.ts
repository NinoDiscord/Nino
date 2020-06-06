import { injectable, inject } from 'inversify';
import PermissionUtils from '../../util/PermissionUtils';
import { Constants } from 'eris';
import { TYPES } from '../../types';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class PardonCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'pardon',
      description: 'Pardon a member from this guild',
      usage: '<user> <amount>',
      aliases: ['unwarn', 'forgive'],
      category: 'Moderation',
      userPermissions: Constants.Permissions.manageRoles,
      botPermissions: Constants.Permissions.manageRoles,
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.sendTranslate('global.noUser');
    if (!ctx.args.has(1) || !(/^[0-9]+$/).test(ctx.args.get(1))) return ctx.sendTranslate('commands.moderation.pardon.notSpecified');

    const userID = ctx.args.get(0);
    const user = findUser(this.bot, userID);
    if (!user || user === undefined) return ctx.sendTranslate('global.unableToFind');

    const member = ctx.guild!.members.get(user.id);
    const amount = Number(ctx.args.get(1));
    if (!member) return ctx.sendTranslate('commands.moderation.notInGuild', {
      user: `${user.username}#${user.discriminator}`
    });

    if (!PermissionUtils.above(ctx.message.member!, member)) return ctx.sendTranslate('global.heirarchy');

    await this.bot.punishments.pardon(member!, amount);
    const warns = await this.bot.warnings.get(ctx.guild!.id, member.id);

    return warns === null 
      ? ctx.sendTranslate('commands.moderation.pardon.noWarnings', { user: `${user.username}#${user.discriminator}` })
      : ctx.sendTranslate('commands.moderation.pardon.warnings', {
        warnings: warns.amount,
        user: `${user.username}#${user.discriminator}`
      });
  }
}
