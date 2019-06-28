import Client, {NinoConfig} from './structures/Client';
import yaml from 'js-yaml';
import fs from 'fs';

const file = fs.readFileSync('application.yml').toString();

const config: NinoConfig = yaml.safeLoad(file);
const client = new Client(config);
client.build().then(() => {
    client.logger.info('Now connecting to Discord...');
});