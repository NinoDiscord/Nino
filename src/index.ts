import { init } from '@sentry/node';
import Bot, { Config } from './structures/Bot';
import container from './inversify.config';
import { TYPES } from './types';

const pkg: any = require('../package.json');

const config = container.get<Config>(TYPES.Config);

const bot = container.get<Bot>(TYPES.Bot);

init({
  dsn: config.sentryDSN,
  release: `${pkg.version} (${config.mode})`,
});

bot
  .build()
  .catch(ex => {
    bot.logger.log('error', 'Unable to build:\n' + ex.stack);
  });
