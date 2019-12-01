import { init } from '@sentry/node';
import Client, { NinoConfig } from './structures/Client';
import { safeLoad } from 'js-yaml';
import container from './inversify.config';
import { TYPES } from './types';

const pkg: any = require('../package.json');

const config = container.get<NinoConfig>(TYPES.NinoConfig);
const client = container.get<Client>(TYPES.Client);

init({
    dsn: config.sentryDSN,
    release: `${pkg.version} (${config.mode})`
});

client.build().then(() => {
    client.logger.log('info', 'Now connecting to Discord...');
});