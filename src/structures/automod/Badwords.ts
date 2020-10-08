import { Message, TextChannel } from 'eris';
import PermissionUtils from '../../util/PermissionUtils';
import Bot from '../Bot';

/**
 * An event handler to check for bad words posted
 */
export default class AutoModBadWords {
  public bot: Bot;

  constructor(client: Bot) {
    this.bot = client;
  }

  /**
   * Handles a message event, if there was a bad word spotted and the bot has the correct permissions, it warns the user.
   * Returns whether the event was handled
   *
   * @remarks
   * The permissions needed by default are: manageMessages
   * To react it needs to be above a user in the heirarchy.
   *
   * @param m the message
   */
  async handle(m: Message<TextChannel>) {
    if (!m || m === null) return false;
    if (!(m.channel instanceof TextChannel)) return false;

    const me = m.channel.guild.members.get(this.bot.client.user.id)!;
    const self = m.channel.guild.members.get(m.author.id)!;

    if (
      !PermissionUtils.above(me, m.member!) ||
      !m.channel.permissionsOf(me.id).has('manageMessages') ||
      m.author.bot ||
      m.channel.permissionsOf(m.author.id).has('manageMessages')
    ) return false;

    if (self && self.permission.has('banMembers')) return false;

    const settings = await this.bot.settings.get(m.channel.guild.id);
    if (
      !settings ||
      !settings.automod.badwords.enabled
    ) return false;

    const user = await this.bot.userSettings.get(m.author.id);
    const locale = user === null ? this.bot.locales.get(settings.locale)! : user.locale === 'en_US' ? this.bot.locales.get(settings.locale)! : this.bot.locales.get(user.locale)!;

    for (let word of settings.automod.badwords.wordlist) {
      const content = m.content.toLowerCase().split(' ');
      const includes = content.filter(c => c.toLowerCase() === word.toLowerCase()).length > 0;

      if (includes) {
        const punishments = await this.bot.punishments.addWarning(m.member!);
        const response = locale.translate('automod.badwords', { user: m.member ? `${m.member.username}#${m.member.discriminator}` : `${m.author.username}#${m.author.discriminator}` });

        await m.channel.createMessage(response);
        await m.delete();
        for (let punishment of punishments) await this.bot.punishments.punish(m.member!, punishment, '[Automod] Swearing');
        return true;
      }
    }

    return false;
  }
}
