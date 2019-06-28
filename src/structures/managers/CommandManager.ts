import { readdir, readdirSync } from 'fs';
import { Collection } from '@augu/immutable';
import CommandService from '../services/CommandService';
import Command from '../Command';
import { sep } from 'path';
import Client from '../Client';

export default class CommandManager {
    public client: Client;
    public service: CommandService;
    public path: string = `${process.cwd()}${sep}dist${sep}commands`;
    public commands: Collection<Command> = new Collection({ name: 'nino:commands' });

    /**
     * Creates a new instance of the `CommandManager`
     * @param client The client instance
     */
    constructor(client: Client) {
        this.client  = client;
        this.service = new CommandService(client);
    }

    /**
     * Starts the command manager's process
     */
    async start() {
        const groups = await readdirSync(this.path);
        for (let i = 0; i < groups.length; i++) {
            const category = groups[i];
            readdir(`${this.path}${sep}${category}`, (error, files) => {
                if (error) this.client.logger.error(error.stack);
                this.client.logger.info(`Building ${files.length} command${files.length > 1? 's': ''}`);
                files.forEach((file) => {
                    try {
                        const command = require(`${this.path}${sep}${category}${sep}${file}`);
                        const cmd: Command = new command.default(this.client);
    
                        cmd.setParent(category, file);
                            
                        this.commands.set(cmd.name, cmd);
                        this.client.logger.info(`Initialized command ${cmd.name}!`);
                    } catch (err) {
                        this.client.logger.error(`Couldn't initialize command ${file}. Error: ${err}`)
                    }
                    
                });
            });
        }
    }
}