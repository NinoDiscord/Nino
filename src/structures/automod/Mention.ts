import { Message, TextChannel } from 'eris';
import PermissionUtil from '../../util/PermissionUtils';
import Bot from '../Bot';

export default class AutoModMention {
  public bot: Bot;
  constructor(client: Bot) {
    this.bot = client;
  }

  async handle(m: Message<TextChannel>): Promise<boolean> {
    if (!m || m === null) return false;
    if (!(m.channel instanceof TextChannel)) return false;

    const me = m.channel.guild.members.get(this.bot.client.user.id)!;

    if (
      !PermissionUtil.above(me, m.member!) ||
      !m.channel.permissionsOf(me.id).has('manageMessages') ||
      m.author.bot ||
      m.channel.permissionsOf(m.author.id).has('manageMessages')
    ) return false;

    const settings = await this.bot.settings.get(m.channel.guild.id);
    if (!settings || !settings.automod.mention) return false;

    if (m.mentions.length >= 4) {
      const punishments = await this.bot.punishments.addWarning(m.member!);
      for (let punish of punishments) await this.bot.punishments.punish(
        m.member!,
        punish,
        '[Automod] Mention Spam'
      );

      const user = await this.bot.userSettings.get(m.author.id);
      const locale = user === null ? this.bot.locales.get(settings.locale)! : user.locale === 'en_US' ? this.bot.locales.get(settings.locale)! : this.bot.locales.get(user.locale)!;

      const response = locale.translate('automod.mentions', { user: m.member ? `${m.member.username}#${m.member.discriminator}` : `${m.author.username}#${m.author.discriminator}` });
      await m.channel.createMessage(response);
      return true;
    }

    return false;
  }
}
