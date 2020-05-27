import { Message, TextChannel } from 'eris';
import { replaceMessage } from '../../util';
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
  async handle(m: Message): Promise<boolean> {
    if (!m || m === null) return false;
    const channel = m.channel as TextChannel;
    const guild = channel.guild;
    const me = guild.members.get(this.bot.client.user.id)!;

    if (
      !PermissionUtils.above(me, m.member!) ||
      !channel.permissionsOf(me.id).has('manageMessages') ||
      m.author.bot ||
      channel.permissionsOf(m.author.id).has('manageMessages')
    ) return false;

    if (m.content.match(this.regex)) {
      const settings = await this.bot.settings.get(guild.id);
      if (!settings || !settings.automod.invites) return false;

      const response = (!settings.responses || !settings.responses.invite.enabled) ?
        replaceMessage('Please don\'t advertise, %author%', m.author) :
        replaceMessage(settings.responses.invite.message, m.author);
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
