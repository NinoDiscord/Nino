import { readdir } from 'fs';
import { sep } from 'path';
import Event from '../Event';

export default class EventManager {
    public client: any;
    public path: string = `${process.cwd()}${sep}events`;

    /**
     * Creates a new instance of the event manager
     * @param client The client instance
     */
    constructor(client: any) {
        this.client = client;
    }

    /**
     * Starts the event manager's process
     */
    start() {
        readdir(this.path, (error, files) => {
            if (error) this.client.logger.error(error.stack);
            this.client.logger.info(`Building ${files.length} event${files.length > 1? 's': ''}!`);
            files.forEach((file) => {
                const event = require(`${this.path}${sep}${file}`);
                const ev: Event = new event.default(this.client);
                this.emit(ev);
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
                this.client.logger.error(`Unable to run the "${ev.event}" event:\n${ex}`);
            }
        };
        this.client.on(ev.event, wrapper);
    }
}