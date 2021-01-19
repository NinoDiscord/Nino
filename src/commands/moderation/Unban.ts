import { Punishment, PunishmentType } from '../../structures/services/PunishmentService';
import { injectable, inject } from 'inversify';
import { Constants } from 'eris';
import { findId } from '../../util/UserUtil';
import { Module } from '../../util';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class UnbanCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'unban',
      description: 'Unbans a user from a guild',
      usage: '<user> <reason> [--reason]',
      aliases: ['unbanne'],
      category: Module.Moderation,
      guildOnly: true,
      userPermissions: Constants.Permissions.banMembers,
      botPermissions: Constants.Permissions.banMembers
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.sendTranslate('global.noUser');

    const id = findId(ctx.args.get(0));

    if (!id) return ctx.sendTranslate('global.unableToFind');
    if (!(await ctx.guild!.getBans()).find(v => v.user.id === id)) return ctx.sendTranslate('global.notInBanList');

    const reason = ctx.args.has(1) ? ctx.args.slice(1).join(' ') : undefined;
    await this.bot.timeouts.cancelTimeout(id, ctx.guild!, 'unban');

    const punishment = new Punishment(PunishmentType.Unban, {
      moderator: ctx.sender
    });

    try {
      await this.bot.punishments.punish({ id, guild: ctx.guild! }, punishment, reason);
      return ctx.sendTranslate('commands.moderation.unban');
    } catch (e) {
      return ctx.sendTranslate('commands.moderation.unable', {
        type: 'unban',
        message: e.message
      });
    }
  }
}
