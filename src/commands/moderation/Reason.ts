import { injectable, inject } from 'inversify';
import { Constants } from 'eris';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class ReasonCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'reason',
      description: 'Updates a case\'s reason',
      usage: '<caseID> <reason>',
      aliases: ['update'],
      category: 'Moderation',
      guildOnly: true,
      userPermissions: Constants.Permissions.banMembers,
      botPermissions: Constants.Permissions.manageMessages
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('Missing the case ID to update');
    if (!ctx.args.has(1)) return ctx.send('Missing the reason to update the case');

    const id = ctx.args.get(0);
    const reason = ctx.args.args.slice(1).join(' ');

    const _case = await this.bot.cases.get(ctx.guild!.id, parseInt(id));
    const settings = await this.bot.settings.get(ctx.guild!.id);

    if (!_case || _case === null) return ctx.send(`Unable to find case **#${id}**, d-does it still exist?`);
    _case.reason = reason;

    await this.bot.cases.update(ctx.guild!.id, parseInt(id), {
      $set: {
        'reason': reason
      }
    }, async (error) => {
      if (error) return ctx.send(`Unable to update case **#${id}**`);

      const message = await this.bot.client.getMessage(settings!.modlog, _case.message);
      await this.bot.punishments.editModlog(_case, message);

      return ctx.send(`:ok_hand: Updated case **#${id}** for **${reason}**`);
    });
  }
}