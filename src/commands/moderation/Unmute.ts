import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { injectable, inject } from 'inversify';
import { Constants, Member } from 'eris';
import { TYPES } from '../../types';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class UnmuteCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'unmute',
      description: 'Unmutes a user from a guild',
      usage: '<user> <reason> [--reason]',
      category: 'Moderation',
      guildOnly: true,
      userPermissions: Constants.Permissions.manageRoles,
      botPermissions:
        Constants.Permissions.manageRoles |
        Constants.Permissions.manageChannels,
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('You need to specify a user.');

    const u = findUser(this.bot, ctx.args.get(0))!;
    if (!u) return ctx.send('I can\'t find this user!');

    const member = ctx.guild!.members.get(u.id);

    if (!member || member === null)
      return ctx.send(
        `User \`${u.username}#${u.discriminator}\` is not in this guild?`
      );

    const reason = ctx.args.has(1) ? ctx.args.slice(1).join(' ') : undefined;
    await this.bot.timeouts.cancelTimeout(member.id, ctx.guild!, 'unmute');
    const punishment = new Punishment(PunishmentType.Unmute, {
      moderator: ctx.sender,
    });
    try {
      await this.bot.punishments.punish(member!, punishment, reason);
      const prefix = member instanceof Member ? member.user.bot ? 'Bot' : 'User' : 'User';

      return ctx.send(`${prefix} was successfully banned`);
    } catch (e) {
      ctx.send('Cannot unmute user, ' + e.message);
    }
  }
}
