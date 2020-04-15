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
      category: 'Generic',
      ownerOnly: false,
    });
  }

  async run(ctx: Context) {
    const embed = this.bot.getEmbed()
      .setTitle('Invite Me')
      .setDescription(stripIndents`
        > **Invite me to your server today o-or join my owner's Discord to get updates and such...**

        :link: **<https://discordapp.com/oauth2/authorize?client_id=${ctx.me.id}&scope=bot>**
        :island: **<https://discord.gg/7TtMP2n>**
      `)
      .build();

    return ctx.embed(embed);
  }
}