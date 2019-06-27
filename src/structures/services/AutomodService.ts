import NinoClient from "../Client";
import AutoModSpam from "../automod/Spam";
import AutoModInvite from "../automod/Invite";
import { Message } from "eris";

export default class AutomodService {
    private client: NinoClient;
    private spamhandler: AutoModSpam;
    private invitehandler: AutoModInvite;

    constructor(client: NinoClient) {
        this.client = client;
        this.spamhandler = new AutoModSpam(client);
        this.invitehandler = new AutoModInvite(client);
    }

    async handle(m: Message) {
        this.spamhandler.handle(m);
        this.invitehandler.handle(m);
    }

}