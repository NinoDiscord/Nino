import { injectable, inject } from 'inversify';
import { Constants } from 'eris';
import findUser from '../../util/UserUtil';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class WarningsCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'warnings',
      description: 'Shows the amount of warnings a member has.',
      usage: '<user>',
      aliases: ['warns'],
      category: 'Moderation',
      userPermissions: Constants.Permissions.manageRoles,
      botPermissions: Constants.Permissions.manageRoles,
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    const locale = await ctx.getLocale();
    if (!ctx.args.has(0)) return ctx.send('You need to specify a user.');

    const userID = ctx.args.get(0);
    const u = findUser(this.bot, userID);
    if (!u || u === undefined) return ctx.send(locale.translate('global.unableToFind'));

    const member = ctx.guild!.members.get(u.id);
    if (!member) return ctx.send(locale.translate('commands.moderation.notInGuild', {
      user: `${u.username}#${u.discriminator}`
    }));

    const settings = await this.bot.warnings.get(ctx.guild!.id, member.id);
    const message = !settings
      ? locale.translate('commands.moderation.warnings.none')
      : locale.translate('commands.moderation.warnings.message', { warnings: settings.amount });

    return ctx.send(message);
  }
}