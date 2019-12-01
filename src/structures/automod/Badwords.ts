import { Message, TextChannel } from 'eris';
import Bot from '../Bot';
import PermissionUtils from '../../util/PermissionUtils';

/**
 * An event handler to check for bad words posted;
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
    const settings = await this.bot.settings.get(guild.id);

    if (!settings || !settings.automod.badwords.enabled) return false;

    for (let badword of settings.automod.badwords.wordlist) {
      if (m.content.toLowerCase().indexOf(badword.toLowerCase()) !== -1) {
        const punishments = await this.bot.punishments.addWarning(m.member!);
        await m.channel.createMessage(
          `HEY ${m.member!.mention}! Watch your language!`
        );
        await m.delete();
        for (let punishment of punishments)
          await this.bot.punishments.punish(
            m.member!,
            punishment,
            'Automod (Swearing)'
          );
        return true;
      }
    }
    return false;
  }
}
