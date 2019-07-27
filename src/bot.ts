import { init, configureScope } from '@sentry/node';
import Client, { NinoConfig } from './structures/Client';
import { RewriteFrames } from '@sentry/integrations';
import { readFileSync } from 'fs';
import { safeLoad } from 'js-yaml';

const file = readFileSync('application.yml', 'utf8');

const config: NinoConfig = safeLoad(file);
const client = new Client(config);

init({
    dsn: config.sentryDSN,
    integrations: [new RewriteFrames({
        root: __dirname || process.cwd()
    })]
});

configureScope(scope => {
    scope.setTag('mode', config.mode);
});

client.build().then(() => {
    client.logger.info('Now connecting to Discord...');
});