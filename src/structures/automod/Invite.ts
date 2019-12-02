import { Message, TextChannel } from 'eris';
import Bot from '../Bot';
import PermissionUtils from '../../util/PermissionUtils';

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
 */
export default class AutoModInvite {
  public bot: Bot;
  private regex: RegExp = /(http(s)?:\/\/(www.)?)?(discord.gg|discord.io|discord.me|discord.link|invite.gg)\/\w+/;

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
    const channel = m.channel as TextChannel;
    const guild = channel.guild;
    const me = guild.members.get(this.bot.client.user.id)!;

    if (
      !PermissionUtils.above(me, m.member!) ||
      !channel.permissionsOf(me.id).has('manageMessages') ||
      m.author.bot ||
      channel.permissionsOf(m.author.id).has('manageMessages')
    )
      // TODO: add permission checks. I will need to figure out those!
      return false;

    if (m.content.match(this.regex)) {
      const settings = await this.bot.settings.get(guild.id);

      if (!settings || !settings.automod.invites) return false;

      await m.channel.createMessage(
        `HEY ${m.member!.mention}! NO ADS ALLOWED!`
      );
      await m.delete();
      const punishments = await this.bot.punishments.addWarning(m.member!);
      for (let punishment of punishments)
        await this.bot.punishments.punish(
          m.member!,
          punishment,
          'Automod (Advertisements)'
        );
      return true;
    }
    return false;
  }
}
