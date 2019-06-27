import Client, {NinoConfig} from './structures/Client';
import yaml from 'js-yaml';
import fs from 'fs';

const file = fs.readFileSync('application.yml').toString();

const config = yaml.safeLoad(file) as NinoConfig;
const client = new Client(config);
client.build().then(() => {
    client.logger.info('We\'re up and running baby!');
})