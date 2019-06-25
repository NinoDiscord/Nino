import { readdir, readdirSync } from 'fs';
import { Collection } from '@augu/immutable';
import Command from '../Command';
import { sep } from 'path';
import Client from '../Client';

export default class CommandManager {
    public client: Client;
    public service: any;
    public path: string = `${process.cwd()}${sep}commands`;
    public commands: Collection<Command> = new Collection({ name: 'nino:commands' });

    /**
     * Creates a new instance of the `CommandManager`
     * @param client The client instance
     */
    constructor(client: Client) {
        this.client  = client;
        // this.service = new CommandService(client);
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
                files.forEach((file, index) => {
                    const command = require(`${this.path}${sep}${category}${sep}${file}`);
                    const cmd: Command = new command.default(this.client);

                    cmd
                        .setParent(category, file)
                        .setID(index);
                        
                    this.commands.set(cmd.name, cmd);
                    this.client.logger.info(`Initialized command ${cmd.name}!`);
                });
            });
        }
    }
}