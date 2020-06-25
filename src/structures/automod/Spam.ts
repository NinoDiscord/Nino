import { Message, TextChannel } from 'eris';
import PermissionUtils from '../../util/PermissionUtils';
import { Collection } from '@augu/immutable';
import Bot from '../Bot';

/**
 * An event handler to check for ongoing spam.
 *
 * @remarks
 * The method used is a queue with message timestamps, it checks if there are over 5 messages in 3 seconds.
 * 5 messages - the length of the queue is 5
 * 3 seconds  - the difference between the first message in the queue (newest) and the last one (oldest) is below 3000 milliseconds.
 * It auto evacuates message timestamps so no old messages will be kept.
 */
export default class AutoModSpam {
  public bot: Bot;
  public buckets: Collection<Collection<number[]>> = new Collection<Collection<number[]>>();

  constructor(client: Bot) {
    this.bot = client;
  }

  __cleanUp(guildId: string) {
    let now = Date.now();
    let ids: (string | number)[] = [];
    this.buckets.get(guildId)!.forEach((v, k) => {
      let diff = now - v[v.length-1];
      if (now - v[v.length - 1] >= 5000) {
        ids.push(k);
      }
    });
    ids.forEach(element => {
      this.buckets.delete(element);
    });
  }

  __getQueue(guildId: string, userId: string): number[] {
    if (!this.buckets.has(guildId)) {
      this.buckets.set(guildId, new Collection<number[]>());
    }
    if (!this.buckets.get(guildId)!.has(userId)) {
      this.buckets.get(guildId)!.set(userId, []);
    }
    return this.buckets.get(guildId)!.get(userId)!;
  }

  __clearQueue(guildId: string, userId: string) {
    this.buckets.get(guildId)!.delete(userId);
  }

  /**
   * Handles a message event, if there is an ongoing spam and the bot has the correct permissions, it warns the user.
   * Returns whether the event was handled
   *
   * @remarks
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

    const settings = await this.bot.settings.get(m.channel.guild.id);
    if (!settings || !settings.automod.spam) return false;

    const queue = this.__getQueue(m.channel.guild.id, m.author.id);
    queue.push(m.timestamp);

    if (queue.length >= 5) {
      const oldTime = queue.shift()!;
      if (m.editedTimestamp && m.editedTimestamp > m.timestamp) return false;
      if (m.timestamp - oldTime <= 3000) {
        this.__clearQueue(m.channel.guild.id, m.author.id);
        let punishments = await this.bot.punishments.addWarning(m.member!);
        for (let punishment of punishments) await this.bot.punishments.punish(
          m.member!,
          punishment,
          `[Automod] Spamming in <#${m.channel.id}>`
        );

        const user = await this.bot.userSettings.get(m.author.id);
        const locale = user === null ? this.bot.locales.get(settings.locale)! : user.locale === 'en_US' ? this.bot.locales.get(settings.locale)! : this.bot.locales.get(user.locale)!;
  
        const response = locale.translate('automod.invites', { user: m.member ? `${m.member.username}#${m.member.discriminator}` : `${m.author.username}#${m.author.discriminator}` });  
        await m.channel.createMessage(response);
        return true;
      }
    }
    
    this.__cleanUp(m.channel.guild.id);

    return false;
  }
}
