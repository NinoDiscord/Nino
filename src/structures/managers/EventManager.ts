import { readdir } from 'fs';
import { sep } from 'path';
import Client from '../Bot';
import Event from '../Event';

export default class EventManager {
    public bot: Client;
    public path: string = `${process.cwd()}${sep}dist${sep}events`;

    /**
     * Creates a new instance of the event manager
     * @param client The client instance
     */
    constructor(client: Client) {
        this.bot = client;
    }

    /**
     * Starts the event manager's process
     */
    start() {
        readdir(this.path, (error, files) => {
            if (error && !!error.stack) this.bot.logger.log('error', error.stack);
            this.bot.logger.log('info', `Building ${files.length} event${files.length > 1? 's': ''}!`);
            files.forEach((file) => {
                try {
                    const event = require(`${this.path}${sep}${file}`);
                    const ev: Event = new event.default(this.bot);
                    this.emit(ev);
                } catch (ignored) {}
                
            });
        });
    }

    /**
     * Emits the event to the `EventEmitter` from the Eris client
     * @param ev The event
     */
    emit(ev: Event) {
        const wrapper = async(...args) => {
            try {
                await ev.emit(...args);
            } catch(ex) {
                this.bot.logger.log('error', `Unable to run the '${ev.event}' event:\n${ex}`);
            }
        };
        this.bot.client.on(ev.event, wrapper);
    }
}