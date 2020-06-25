import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class InviteCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'invite',
      description: 'Gives you the invite for the bot.',
      aliases: ['inv'],
      ownerOnly: false,
    });
  }

  async run(ctx: Context) {
    const embed = this.bot.getEmbed()
      .setTitle(ctx.translate('commands.generic.invite.title'))
      .setDescription(ctx.translate('commands.generic.invite.description', {
        invite: `<https://discordapp.com/oauth2/authorize?client_id=${ctx.me.id}&scope=bot>`,
        server: 'https://discord.gg/7TtMP2n'
      }))
      .build();

    return ctx.embed(embed);
  }
}
