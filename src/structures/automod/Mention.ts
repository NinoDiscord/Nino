import { Message, TextChannel } from 'eris';
import { replaceMessage } from '../../util';
import PermissionUtil from '../../util/PermissionUtils';
import Bot from '../Bot';

export default class AutoModMention {
  public bot: Bot;
  constructor(client: Bot) {
    this.bot = client;
  }

  async handle(m: Message): Promise<boolean> {
    const channel = m.channel as TextChannel;
    const nino = channel.guild.members.get(this.bot.client.user.id)!;

    if (
      !PermissionUtil.above(nino, m.member!) ||
      (m.channel as TextChannel)
        .permissionsOf(m.author.id)
        .has('manageMessages')
    ) return false;

    const settings = await this.bot.settings.get(channel.guild.id);
    if (!settings || !settings.automod.mention) return false;

    if (m.mentions.length >= 4) {
      const punishments = await this.bot.punishments.addWarning(m.member!);
      for (let punish of punishments) await this.bot.punishments.punish(
        m.member!,
        punish,
        'Automod (Mention Spam)'
      );

      const response = !settings.responses.mention.enabled ?
        replaceMessage('%author%, please don\'t mention more than 4 people at once!', m.author) :
        replaceMessage(settings.responses.mention.message, m.author);

      await m.channel.createMessage(response);
      return true;
    }

    return false;
  }
}