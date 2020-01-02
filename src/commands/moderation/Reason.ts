import { Constants } from 'eris';
import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class ReasonCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'reason',
      description: 'Updates a case reason',
      usage: '<caseID> <reason>',
      aliases: ['update-reason'],
      category: 'Moderation',
      guildOnly: true,
      userpermissions: Constants.Permissions.banMembers,
      botpermissions: Constants.Permissions.manageMessages,
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('Missing `<caseID>` argument');
    if (!ctx.args.has(1)) return ctx.send('Missing `<reason>` argument');

    const caseID = ctx.args.get(0);
    const reason = ctx.args.args.slice(1).join(' ');
    const _case = await this.bot.cases.get(ctx.guild!.id, parseInt(caseID));
    const settings = await this.bot.settings.get(ctx.guild!.id);

    if (!_case || _case === null)
      return ctx.send(`Case #${caseID} was not found.`);
    _case.reason = reason;

    ctx.send(`:ok_hand: Updated case **#${caseID}** for \`${reason}\``);
    await this.bot.cases.update(
      ctx.guild!.id,
      parseInt(caseID),
      {
        $set: {
          reason,
        },
      },
      async error => {
        if (error)
          return ctx.send(`Unable to update case #${caseID}: \`${reason}\``);
        const m = await this.bot.client.getMessage(
          settings!.modlog,
          _case.message
        );
        await this.bot.punishments.editModlog(_case, m);
      }
    );
  }
}
