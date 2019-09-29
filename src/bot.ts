import { init } from '@sentry/node';
import Client, { NinoConfig } from './structures/Client';
import { readFileSync } from 'fs';
import { safeLoad } from 'js-yaml';

const file = readFileSync('application.yml', 'utf8');
const pkg: any = require('../package.json');

const config: NinoConfig = safeLoad(file);
const client = new Client(config);

init({
    dsn: config.sentryDSN,
    release: `${pkg.version} (${config.mode})`
});

client.build().then(() => {
    client.logger.log('info', 'Now connecting to Discord...');
});