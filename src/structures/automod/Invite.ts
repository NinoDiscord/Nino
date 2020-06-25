import { Message, TextChannel } from 'eris';
import PermissionUtils from '../../util/PermissionUtils';
import Bot from '../Bot';

/**
 * An event handler to check for invite links posted.
 *
 * @remarks
 * Supports the following domains:
 * * discord.gg
 * * discord.io
 * * discord.me
 * * discord.link
 * * invite.gg
 * * invite.ink
 */
export default class AutoModInvite {
  public bot: Bot;
  private regex: RegExp = /(http(s)?:\/\/(www.)?)?(discord.gg|discord.io|discord.me|discord.link|invite.gg|invite.ink)\/\w+/;

  constructor(client: Bot) {
    this.bot = client;
  }

  /**
   * Handles a message event, if there was an invite link spotted and the bot has the correct permissions, it warns the user.
   * Returns whether the event was handled
   *
   * @remarks
   * The permissions needed by default are: manageMessages
   * To react it needs to be above a user in the heirarchy.
   *
   * @param m the message
   */
  async handle(m: Message<TextChannel>): Promise<boolean> {
    if (!m || m === null) return false;
    if (!(m.channel instanceof TextChannel)) return false;

    const me = m.channel.guild.members.get(this.bot.client.user.id)!;

    if (
      !PermissionUtils.above(me, m.member!) ||
      !m.channel.permissionsOf(me.id).has('manageMessages') ||
      m.author.bot ||
      m.channel.permissionsOf(m.author.id).has('manageMessages')
    ) return false;

    if (m.content.match(this.regex)) {
      const settings = await this.bot.settings.get(m.channel.guild.id);
      if (!settings || !settings.automod.invites) return false;

      const user = await this.bot.userSettings.get(m.author.id);
      const locale = user === null ? this.bot.locales.get(settings.locale)! : user.locale === 'en_US' ? this.bot.locales.get(settings.locale)! : this.bot.locales.get(user.locale)!;

      const response = locale.translate('automod.invites', { user: m.member ? `${m.member.username}#${m.member.discriminator}` : `${m.author.username}#${m.author.discriminator}` });
      await m.channel.createMessage(response);
      await m.delete();

      const punishments = await this.bot.punishments.addWarning(m.member!);
      for (let punishment of punishments) await this.bot.punishments.punish(
        m.member!,
        punishment,
        'Automod (Advertising)'
      );

      return true;
    }

    return false;
  }
}
