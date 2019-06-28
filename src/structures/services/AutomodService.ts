import NinoClient from "../Client";
import AutoModSpam from "../automod/Spam";
import AutoModInvite from "../automod/Invite";
import { Message } from "eris";
import AutoModBadWords from "../automod/Badwords";

/**
 * Service that generalizes automod event handling
 * 
 * @remarks
 * Automod features currently supported:
 * * anti-spam
 * * anti-invites
 */
export default class AutomodService {
    private spamhandler: AutoModSpam;
    private invitehandler: AutoModInvite;
    private badwordhandler: AutoModBadWords;

    constructor(client: NinoClient) {
        this.spamhandler = new AutoModSpam(client);
        this.invitehandler = new AutoModInvite(client);
        this.badwordhandler = new AutoModBadWords(client);
    }

    /**
     * Returns whether the event was handled
     * 
     * @param m the message
     */
    async handle(m: Message): Promise<boolean> {
        return await this.invitehandler.handle(m) || await this.badwordhandler.handle(m) || await this.spamhandler.handle(m);
    }

}