import "reflect-metadata";
import {Container} from "inversify";
import getDecorators from "inversify-inject-decorators";

let container = new Container();
const { lazyInject } = getDecorators(container);
export { lazyInject };

import {TYPES} from "./types";
import { readFileSync } from 'fs';
import Bot, {Config} from "./structures/Bot";
import {Client} from "eris";
import { safeLoad } from "js-yaml";
import CommandService from "./structures/services/CommandService";
import CommandManager from "./structures/managers/CommandManager";
import AutomodService from "./structures/services/AutomodService";


let config: Config;
try {
    const file = readFileSync('application.yml', 'utf8');

    config = safeLoad(file);
} catch (e) {
    config = {
        environment: 'development',
        databaseUrl: 'mongodb://localhost:27017/nino',
        discord: {
            token: '',
            prefix: 'x!'
        },
        redis: {
            host: 'localhost',
            port: 6379
        },
        webhook: undefined,
        webserver: undefined,
        mode: undefined,
        sentryDSN: undefined,
        botlists: undefined
    };
}


container.bind<Client>(TYPES.Client).toConstantValue(new Client(config.discord.token, {
    maxShards: 'auto',
    disableEveryone: true,
    getAllUsers: true,
    restMode: true
}));
container.bind<Bot>(TYPES.Bot).to(Bot).inSingletonScope();
container.bind<Config>(TYPES.Config).toConstantValue(config);
container.bind<CommandService>(TYPES.CommandService).to(CommandService).inSingletonScope();
container.bind<CommandManager>(TYPES.CommandManager).to(CommandManager).inSingletonScope();
container.bind<AutomodService>(TYPES.AutoModService).to(AutomodService).inSingletonScope();

export default container;