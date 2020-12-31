import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import { createEmptyEmbed } from '../../util/EmbedUtils';
import Eris from 'eris';

@injectable()
export default class InviteCommand extends Command {
  constructor(
    @inject(TYPES.Bot) bot: Bot,
    @inject(TYPES.Client) private client: Eris.Client
  ) {
    super(bot, {
      name: 'invite',
      description: 'Gives you the invite for the bot.',
      aliases: ['inv'],
      ownerOnly: false,
    });
  }

  async run(ctx: Context) {
    const embed = createEmptyEmbed()
      .setTitle(ctx.translate('commands.generic.invite.title'))
      .setDescription(ctx.translate('commands.generic.invite.description', {
        invite: `<https://discord.com/oauth2/authorize?client_id=${this.client.user.id}&scope=bot>`,
        server: 'https://discord.gg/JjHGR6vhcG'
      }))
      .build();

    return ctx.embed(embed);
  }
}
