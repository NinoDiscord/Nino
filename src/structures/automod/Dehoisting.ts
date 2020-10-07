import PermissionUtils from '../../util/PermissionUtils';
import { Member, Constants } from 'eris';
import Bot from '../Bot';

/**
 * An event handler to handle hoisting members
 *
 * @remarks
 * Hoisting:
 * A user whose first letter of the username/nickname comes before 0 in the ascii table is defined as a hoister.
 */
export default class AutoModDehoist {
  public bot: Bot;

  constructor(client: Bot) {
    this.bot = client;
  }

  /**
   * Handles a username / nickname / join event, if the username / nickname is considered as hoisting, modify it so it will no longer hoist.
   * Returns a promise to when the handling has finished
   *
   * @param m the member
   */
  async handle(m: Member): Promise<void> {
    if (m === null) return;

    const guild = m.guild;
    const me = guild.members.get(this.bot.client.user.id)!;
    const name = m.nick || m.username;

    const settings = await this.bot.settings.get(m.guild.id);
    if (!settings || !settings.automod.dehoist) return;
    if (name >= '0') return;

    if (
      !PermissionUtils.above(me, m) || 
      !me.permission.has('manageNicknames') || 
      m.bot || 
      m.permission.has('manageNicknames')
    ) return;

    let index = 0;
    while (index < name.length && name[index] < '0') index++;

    const good = name.substring(index).trim();
    if (good === '' && m.username >= '0') return m.edit({ nick: m.username }, '[Automod] Dehoisted');
    else if (good === '') return m.edit({ nick: 'hoister' }, '[Automod] Dehoisted');
    else return m.edit({ nick: good }, '[Automod] Dehoisted');
  }
}
