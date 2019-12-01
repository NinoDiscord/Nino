import { init } from '@sentry/node';
import Bot, { Config } from './structures/Bot';
import container from './inversify.config';
import { TYPES } from './types';

const pkg: any = require('../package.json');

const config = container.get<Config>(TYPES.Config);
console.log(container.isBound(TYPES.CommandManager), container.isBound(TYPES.Bot));
const bot = container.get<Bot>(TYPES.Bot);

init({
    dsn: config.sentryDSN,
    release: `${pkg.version} (${config.mode})`
});

bot.build().then(() => {
    bot.logger.log('info', 'Now connecting to Discord...');
}).catch(ex => {
    bot.logger.log('error', 'unable to build:\n'+ex.stack);
});