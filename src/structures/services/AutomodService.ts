import { Message, Member, TextChannel } from 'eris';
import { inject, injectable } from 'inversify';
import AutomodAccounts from '../automod/Accounts';
import AutomodSwearing from '../automod/Badwords';
import AutomodDehoist from '../automod/Dehoisting';
import AutomodMention from '../automod/Mention';
import AutomodInvite from '../automod/Invite';
import AutomodSpam from '../automod/Spam';
import AutomodRaid from '../automod/Raid';
import { TYPES } from '../../types';
import Bot from '../Bot';
import 'reflect-metadata';

/**
 * Service that generalizes automod event handling
 *
 * @remarks
 * Automod features currently supported:
 * * anti-spam
 * * anti-invites
 * * swearing
 * * anti-raid
 * * auto dehoist
 * * auto mention
 * * raid-member detection
 */
@injectable()
export default class AutomodService {
  private accounts: AutomodAccounts;
  private swearing: AutomodSwearing;
  private mentions: AutomodMention;
  private invites: AutomodInvite;
  private dehoist: AutomodDehoist;
  private spam: AutomodSpam;
  private raid: AutomodRaid;

  constructor(
    @inject(TYPES.Bot) bot: Bot
  ) {
    this.accounts = new AutomodAccounts(bot);
    this.swearing = new AutomodSwearing(bot);
    this.mentions = new AutomodMention(bot);
    this.dehoist  = new AutomodDehoist(bot);
    this.invites  = new AutomodInvite(bot);
    this.spam     = new AutomodSpam(bot);
    this.raid     = new AutomodRaid(bot);
  }

  /**
   * Returns whether the event was handled
   *
   * @param m the message
   */
  async handleMessage(m: Message<TextChannel>): Promise<boolean> {
    if (!(m.channel instanceof TextChannel)) return false;

    return (
      await this.invites.handle(m) ||
      await this.swearing.handle(m) ||
      await this.spam.handle(m) ||
      await this.mentions.handle(m) || 
      false
    );
  }

  /**
   * Returns whether the event was handled
   * @param m the member
   */
  async handleMemberJoin(m: Member): Promise<boolean> {
    return (
      await this.raid.handle(m) ||
      await this.dehoist.handle(m) ||
      await this.accounts.handle(m) || 
      false
    );
  }

  async handleMemberNameUpdate(m: Member): Promise<void> {
    return this.dehoist.handle(m);
  }
}