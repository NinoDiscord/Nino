import { init, configureScope, Integrations } from '@sentry/node';
import Client, { NinoConfig } from './structures/Client';
import { RewriteFrames } from '@sentry/integrations';
import { readFileSync } from 'fs';
import { safeLoad } from 'js-yaml';
import { Integration } from '@sentry/types';

const file = readFileSync('application.yml', 'utf8');

const config: NinoConfig = safeLoad(file);
const client = new Client(config);

init({
    dsn: config.sentryDSN
});

configureScope(scope => {
    scope.setTag('mode', config.mode);
});

client.build().then(() => {
    client.logger.log('info', 'Now connecting to Discord...');
});