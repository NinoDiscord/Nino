import "reflect-metadata";
import {Container} from "inversify";
import {TYPES} from "./types";
import { readFileSync } from 'fs';
import NinoClient, {NinoConfig} from "./structures/Client";
import {Client} from "eris";
import { safeLoad } from "js-yaml";

let container = new Container();


const file = readFileSync('application.yml', 'utf8');

const config = safeLoad(file);

container.bind<NinoClient>(TYPES.NinoClient).to(NinoClient).inSingletonScope();
container.bind<Client>(TYPES.Client).toConstantValue(new Client(config));
container.bind<NinoConfig>(TYPES.NinoConfig).toConstantValue(config);

export default container;