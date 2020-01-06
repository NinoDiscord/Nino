import {
  Punishment,
  PunishmentType,
} from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import Bot from '../../structures/Bot';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import ms = require('ms');
import PermissionUtils from '../../util/PermissionUtils';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class WarnCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'warn',
      description: 'Warns a member from this guild',
      usage: '<user>',
      aliases: ['addwarn'],
      category: 'Moderation',
      userPermissions:
        Constants.Permissions.manageRoles |
        Constants.Permissions.manageChannels,
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('You need to specify a user.');

    const u = findUser(this.bot, ctx.args.get(0))!;
    if (!u) return ctx.send('I can\'t find this user!');
    const member = ctx.guild!.members.get(u.id);

    if (!member)
      return ctx.send(
        `User \`${u.username}#${u.discriminator}\` is not in this guild?`
      );

    const punishments = await this.bot.punishments.addWarning(member!);
    for (let i of punishments)
      try {
        await this.bot.punishments.punish(member!, i, 'Automod');
      }
      catch (e) {
        return ctx.send(`Unable to punish, ${e.message}`);
      }
    const warns = await this.bot.warnings.get(ctx.guild!.id, member.id);
    return ctx.send(
      `Successfully warned ${member.username}#${
        member.discriminator
      }! They now have ${warns!.amount} warnings!`
    );
  }
}
