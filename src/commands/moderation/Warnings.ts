import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Constants } from 'eris';
import { Module } from '../../util';
import { TYPES } from '../../types';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import WarningService from '../../structures/services/WarningService';

@injectable()
export default class WarningsCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot,
              @inject(TYPES.WarningService) private warningService: WarningService) {
    super(client, {
      name: 'warnings',
      description: 'Shows the amount of warnings a member has.',
      usage: '<user>',
      aliases: ['warns'],
      category: Module.Moderation,
      userPermissions: Constants.Permissions.manageRoles,
      botPermissions: Constants.Permissions.manageRoles,
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('You need to specify a user.');

    const userID = ctx.args.get(0);
    const u = findUser(this.bot, userID);
    if (!u) return ctx.sendTranslate('global.unableToFind');

    const member = ctx.guild!.members.get(u.id);
    if (!member) return ctx.sendTranslate('commands.moderation.notInGuild', {
      user: `${u.username}#${u.discriminator}`
    });

    const settings = await this.warningService.get(ctx.guild!.id, member.id);

    return !settings
      ? ctx.sendTranslate('commands.moderation.warnings.none')
      : ctx.sendTranslate('commands.moderation.warnings.message', { warnings: settings.amount });
  }
}
