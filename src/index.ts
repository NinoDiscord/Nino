import { init } from '@sentry/node';
import Bot, { Config } from './structures/Bot';
import container from './inversify.config';
import { TYPES } from './types';

const pkg: any = require('../package.json');
const config = container.get<Config>(TYPES.Config);
const bot = container.get<Bot>(TYPES.Bot);

if (!config.sentryDSN) {
  console.warn('WARNING: Missing "sentryDSN" in the "config.yml" file! This is optional to add but recommnended!');
} 
else {
  init({
    dsn: config.sentryDSN,
    release: `${pkg.version} (${config.mode})`,
  });
}

bot.build().catch(ex => {
  bot.logger.log('error', 'Unable to build:\n' + ex.stack);
});

process.on('exit', () => {
  bot.database.m.connection.close();
  bot.client.disconnect({ reconnect: false });
  process.kill(process.pid);
});