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
        this.postCount(this.client);
        this.interval = setInterval(() => this.postCount(this.client), 60000);
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
    postCount(client: NinoClient) {
        const guilds = client.guilds.size;
        if (client.config.dbltoken)
            wumpfetch({
                url: `https://discordbots.org/api/bots/${client.user.id}/stats`, 
                method: "POST",
                headers: {
                    "Authorization": client.config.dbltoken,
                    "Content-Type": "application/json"
                },
                data: {
                    "server_count": guilds
                }
            }).send().catch(() => {
                client.logger.error("Failed to post guild stats to Discord Bot List.")
            })
        if (client.config.bfdtoken)
            wumpfetch({
                url: `https://botsfordiscord.com/api/bot/${client.user.id}`, 
                method: "POST",
                headers: {
                    "Authorization": client.config.bfdtoken,
                    "Content-Type": "application/json"
                },
                data: {
                    "server_count": guilds
                }
            }).send().catch(() => {
                client.logger.error("Failed to post guild stats to Bots For Discord.")
            })
        if (client.config.dboatstoken)
            wumpfetch({
                url: `https://discord.boats/api/v2/bot/${client.user.id}`, 
                method: "POST",
                headers: {
                    "Authorization": client.config.dboatstoken,
                    "Content-Type": "application/json"
                },
                data: {
                    "server_count": guilds
                }
            }).send().catch(() => {
                client.logger.error("Failed to post guild stats to Discord Boats.")
            })
        if (client.config.dbgtoken)
            wumpfetch({
                url: `https://api.discordbots.group/v1/bot/${client.user.id}`, 
                method: "POST",
                headers: {
                    "Authorization": client.config.dboatstoken,
                    "Content-Type": "application/json"
                },
                data: {
                    "server_count": guilds
                }
            }).send().catch(() => {
                client.logger.error("Failed to post guild stats to Discord Bots Group.")
            })
    }
}