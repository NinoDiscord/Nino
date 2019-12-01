import Bot, { Config } from '../Bot';
import wumpfetch from 'wumpfetch';

/**
 * Service that posts guild count to botlists.
 * @remarks
 * Posts every minute to all botlists.
 */
export default class BotListService {
    private bot: Bot;
    private interval?: NodeJS.Timeout;

    constructor(client: Bot) {
        this.bot = client;
    }

    /**
     * Start posting guild stats
     */
    start() {
        this.postCount(this.bot.client.guilds.size, this.bot.client.user.id, this.bot.config, this.bot.logger);
        this.interval = setInterval(async () => {
            const guilds = await this.bot.redis.get('guilds');
            if (guilds) this.postCount(Number(guilds), this.bot.client.user.id, this.bot.config, this.bot.logger);

        }, 60000);
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
    postCount(guilds: Number, id: string,  config: Config, logger: any) {
        if (config.botlists && config.botlists.topggtoken) {
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
        if (config.botlists && config.botlists.bfdtoken) {
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
        if (config.botlists && config.botlists.dboatstoken) {
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
        if (config.botlists && config.botlists.blstoken) {
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
