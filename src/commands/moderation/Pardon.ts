import {
  Punishment,
  PunishmentType,
} from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import Bot from '../../structures/Bot';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import PermissionUtils from '../../util/PermissionUtils';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class PardonCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'pardon',
      description: 'Pardon a member from this guild',
      usage: '<user> <amount>',
      aliases: ['unwarn', 'forgive'],
      category: 'Moderation',
      userpermissions:
        Constants.Permissions.manageRoles |
        Constants.Permissions.manageChannels,
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('You need to specify a user.');
    if (!ctx.args.has(1) || !/^[0-9]+$/.test(ctx.args.get(1)))
      return ctx.send('Requires an amount of warnings to remove.');

    const u = findUser(this.bot, ctx.args.get(0))!;
    if (!u) return ctx.send('I can\'t find this user!');
    const member = ctx.guild!.members.get(u.id);
    const amount = Number(ctx.args.get(1));

    if (!member)
      return ctx.send(
        `User \`${u.username}#${u.discriminator}\` is not in this guild?`
      );

    if (!PermissionUtils.above(ctx.message.member!, member))
      return ctx.send('The user is above you in the heirarchy.');

    await this.bot.punishments.pardon(member!, amount);
    const warns = await this.bot.warnings.get(ctx.guild!.id, member.id);
    if (!warns)
      return ctx.send(
        `Successfully pardoned ${member.username}#${member.discriminator}! They now have 0 warnings!`
      );
    return ctx.send(
      `Successfully pardoned ${member.username}#${
        member.discriminator
      }! They now have ${warns!.amount} warnings!`
    );
  }
}
