import NinoClient from "../Client";
import AutoModSpam from "../automod/Spam";
import AutoModInvite from "../automod/Invite";
import { Message, Member } from "eris";
import AutoModBadWords from "../automod/Badwords";
import AutoModRaid from "../automod/Raid";
import AutoModDehoist from "../automod/Dehoisting";

/**
 * Service that generalizes automod event handling
 * 
 * @remarks
 * Automod features currently supported:
 * * anti-spam
 * * anti-invites
 * * swearing
 */
export default class AutomodService {
    private spamhandler: AutoModSpam;
    private invitehandler: AutoModInvite;
    private badwordhandler: AutoModBadWords;
    private raidhandler: AutoModRaid;
    private dehoisthandler: AutoModDehoist;

    constructor(client: NinoClient) {
        this.spamhandler = new AutoModSpam(client);
        this.invitehandler = new AutoModInvite(client);
        this.badwordhandler = new AutoModBadWords(client);
        this.raidhandler = new AutoModRaid(client);
        this.dehoisthandler = new AutoModDehoist(client);
    }

    /**
     * Returns whether the event was handled
     * 
     * @param m the message
     */
    async handleMessage(m: Message): Promise<boolean> {
        return await this.invitehandler.handle(m) || await this.badwordhandler.handle(m) || await this.spamhandler.handle(m);
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