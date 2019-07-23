import NinoClient from "../Client";
import wumpfetch from "wumpfetch";

/**
 * Service that posts guild count to botlists.
 * @remarks
 * Posts every minute to all botlists.
 */
export default class BotListService {
    private client: NinoClient;
    private interval?: NodeJS.Timeout;

    constructor(client: NinoClient) {
        this.client = client;
    }

    /**
     * Start posting guild stats
     */
    start() {
        this.interval = setInterval(this.postCount, 60000);
    }

    /**
     * Stop posting guild stats
     */
    stop() {
        if (this.interval) {
            this.interval.unref();
        }
    }

    /**
     * Post guild stats
     */
    postCount() {
        const guilds = this.client.guilds.size;
        if (this.client.config.dbltoken)
            wumpfetch({
                url: `https://discordbots.org/api/bots/${this.client.user.id}/stats`, 
                method: "POST",
                headers: {
                    "Authorization": this.client.config.dbltoken,
                    "Content-Type": "application/json"
                },
                data: {
                    "server_count": guilds
                }
            }).send().catch(() => {
                this.client.logger.error("Failed to post guild stats to Discord Bot List.")
            })
        if (this.client.config.bfdtoken)
            wumpfetch({
                url: `https://botsfordiscord.com/api/bot/${this.client.user.id}`, 
                method: "POST",
                headers: {
                    "Authorization": this.client.config.bfdtoken,
                    "Content-Type": "application/json"
                },
                data: {
                    "server_count": guilds
                }
            }).send().catch(() => {
                this.client.logger.error("Failed to post guild stats to Bots For Discord.")
            })
        if (this.client.config.dboatstoken)
            wumpfetch({
                url: `https://discord.boats/api/v2/bot/${this.client.user.id}`, 
                method: "POST",
                headers: {
                    "Authorization": this.client.config.dboatstoken,
                    "Content-Type": "application/json"
                },
                data: {
                    "server_count": guilds
                }
            }).send().catch(() => {
                this.client.logger.error("Failed to post guild stats to Discord Boats.")
            })
        if (this.client.config.dbgtoken)
            wumpfetch({
                url: `https://api.discordbots.group/v1/bot/${this.client.user.id}`, 
                method: "POST",
                headers: {
                    "Authorization": this.client.config.dboatstoken,
                    "Content-Type": "application/json"
                },
                data: {
                    "server_count": guilds
                }
            }).send().catch(() => {
                this.client.logger.error("Failed to post guild stats to Discord Bots Group.")
            })
    }
}