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
    if (!ctx.args.has(0)) return ctx.send('You\'ll need to specify a user');
    if (!ctx.args.has(1) || !(/^[0-9]+$/).test(ctx.args.get(1))) return ctx.send('You didn\'t specify an amount of warnings to remove');

    const userID = ctx.args.get(0);
    const user = findUser(this.bot, userID);
    if (!user || user === undefined) return ctx.send('Cannot find member in this guild');

    const member = ctx.guild!.members.get(user.id);
    const amount = Number(ctx.args.get(1));
    if (!member) return ctx.send(`User **\`${user.username}#${user.discriminator}\`** isn't in the guild`);
    if (!PermissionUtils.above(ctx.message.member!, member)) return ctx.send('The user is above or the same heirarchy as you');
  
    await this.bot.punishments.pardon(member!, amount);
    const warns = await this.bot.warnings.get(ctx.guild!.id, member.id);
    if (!warns) return ctx.send(`${member.username}#${member.discriminator} now has no warnings`);
    else return ctx.send(`Warned ${member.username}#${member.discriminator}! Now they have ${warns!.amount} warnings.`);
  }
}