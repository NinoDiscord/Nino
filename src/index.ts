import { init, configureScope } from '@sentry/node';
import Bot, { Config } from './structures/Bot';
import { commitHash } from './util';
import container from './inversify.config';
import { TYPES } from './types';
import Logger from './structures/Logger';

const pkg: any = require('../package.json');
const config = container.get<Config>(TYPES.Config);
const bot = container.get<Bot>(TYPES.Bot);
const logger = new Logger();

if (!config.sentryDSN) {
  logger.warn('WARNING: Missing "sentryDSN" in the "config.yml" file! This is optional to add but is recommnended!');
} else {
  init({
    dsn: config.sentryDSN,
    release: `${pkg.version} (${commitHash})`,
    environment: config.environment || 'development'
  });

  configureScope(scope => {
    scope.setTags({
      'project.environment': config.environment,
      'project.version': pkg.version,
      'project.commit': commitHash,
      'system.user': require('os').userInfo().username,
      'system.os': process.platform
    });
  });

  logger.info('Installed Sentry successfully, now building Nino...');
}

bot.build()
  .then(() => bot.logger.info('All set!'));

process.on('SIGINT', () => {
  bot.dispose();
  bot.logger.warn('Process was exited!');
  process.exit();
});