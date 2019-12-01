import NinoClient, { NinoConfig } from '../Client';
import wumpfetch from 'wumpfetch';

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
        this.postCount(this.client.guilds.size, this.client.user.id, this.client.config, this.client.logger);
        this.interval = setInterval(async () => {
            const guilds = await this.client.redis.get('guilds');
            if (guilds) this.postCount(Number(guilds), this.client.user.id, this.client.config, this.client.logger);
        }, 60000);
    }

    /**
     * Stop posting guild stats
     */
    stop() {
        if (this.interval) this.interval.unref();
    }

    /**
     * Post guild stats
     */
    postCount(guilds: Number, id: string,  config: NinoConfig, logger: any) {
        if (config.botlists.topggtoken) {
            wumpfetch({
                url: `https://top.gg/api/bots/${id}/stats`, 
                method: 'POST',
                data: {
                    'server_count': guilds
                }
            }).header({
                'Authorization': config.botlists.topggtoken,
                'Content-Type': 'application/json'
            }).send().then(res => {
                logger.info(`Posted guild stats to TOP.GG: ${res.statusCode} : ${res.body}`);
            }).catch(() => {
                logger.error('Failed to post guild stats to TOP.GG.');
            });
        }
        if (config.botlists.bfdtoken) {
            wumpfetch({
                url: `https://botsfordiscord.com/api/bot/${id}`, 
                method: 'POST',
                data: {
                    'server_count': guilds
                }
            }).header({
                'Authorization': config.botlists.bfdtoken,
                'Content-Type': 'application/json'
            }).send().then(res => {
                logger.info(`Posted guild stats to Bots For Discord: ${res.statusCode} : ${res.body}`);
            }).catch(() => {
                logger.error('Failed to post guild stats to Bots For Discord.');
            });
        }
        if (config.botlists.dboatstoken) {
            wumpfetch({
                url: `https://discord.boats/api/bot/${id}`, 
                method: 'POST',
                data: {
                    'server_count': guilds
                }
            }).header({
                'Authorization': config.botlists.dboatstoken,
                'Content-Type': 'application/json'
            }).send().then(res => {
                logger.info(`Posted guild stats to Discord Boats: ${res.statusCode} : ${res.body}`);
            }).catch(() => {
                logger.error('Failed to post guild stats to Discord Boats.');
            });
        }
        if (config.botlists.blstoken) {
            wumpfetch({
                url: `https://api.botlist.space/v1/bots/${id}`, 
                method: 'POST',
                data: {
                    'server_count': guilds
                }
            }).header({
                'Authorization': config.botlists.blstoken,
                'Content-Type': 'application/json'
            }).send().then(res => {
                logger.info(`Posted guild stats to Botlist.space: ${res.statusCode} : ${res.body}`);
            }).catch(() => {
                logger.error('Failed to post guild stats to Botlist.space.');
            });
        }
    }
}
