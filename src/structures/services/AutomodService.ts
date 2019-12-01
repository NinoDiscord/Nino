import Bot from '../Bot';
import AutoModSpam from '../automod/Spam';
import AutoModInvite from '../automod/Invite';
import { Message, Member } from 'eris';
import AutoModBadWords from '../automod/Badwords';
import AutoModRaid from '../automod/Raid';
import AutoModDehoist from '../automod/Dehoisting';
import AutoModMention from '../automod/Mention';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import "reflect-metadata";

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
 */
@injectable()
export default class AutomodService {
    private spamhandler: AutoModSpam;
    private invitehandler: AutoModInvite;
    private badwordhandler: AutoModBadWords;
    private raidhandler: AutoModRaid;
    private dehoisthandler: AutoModDehoist;
    private mentionhandler: AutoModMention;

    constructor(@inject(TYPES.Bot) bot: Bot) {
        this.spamhandler    = new AutoModSpam(bot);
        this.invitehandler  = new AutoModInvite(bot);
        this.badwordhandler = new AutoModBadWords(bot);
        this.raidhandler    = new AutoModRaid(bot);
        this.dehoisthandler = new AutoModDehoist(bot);
        this.mentionhandler = new AutoModMention(bot);
    }

    /**
     * Returns whether the event was handled
     * 
     * @param m the message
     */
    async handleMessage(m: Message): Promise<boolean> {
        return await this.invitehandler.handle(m) || await this.badwordhandler.handle(m) || await this.spamhandler.handle(m) || await this.mentionhandler.handle(m);
    }

    /**
     * Returns whether the event was handled
     * @param m the member
     */
    async handleMemberJoin(m: Member): Promise<boolean> {
        return await this.raidhandler.handle(m) || await this.dehoisthandler.handle(m) || false;
    }

    async handleMemberNameUpdate(m: Member): Promise<void> {
        return this.dehoisthandler.handle(m);
    }
}