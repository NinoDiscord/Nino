import NinoClient from '../structures/Client';
import Kirbe from 'kirbe';
import Command from '../structures/Command';

export default class NinoWebServer {
    public instance: Kirbe.Server = new Kirbe.Server();
    public client: NinoClient;
    public responses: string[] = [
        'Hello, why are you here? No one said you\'re allowed here.',
        'W-what?! How did you get here?? Isn\'t this IP address locked away from the developers? H-huh?!',
        'H-hello, why are you here? You\'re an developer, r-right? If not, please report this!!'
    ];

    constructor(client: NinoClient) {
        this.client = client;
    }

    getAllCommands() {
        const arr: Command[] = [];
        for (const value of this.client.manager.commands.values()) arr.push(value);
        return arr;
    }

    start() {
        this.instance.get('/', (_, res) => res.status(200).body({ success: false, message: this.responses[Math.floor(Math.random() * this.responses.length)] }).end());
        this.instance.get('/commands', (_, res) => res.status(200).body({ success: true, data: this.getAllCommands() }).end());
        this.instance.listen(this.client.config.webserver, () => this.client.logger.info(`Webserver is now listening on port ${this.client.config.webserver}.`));
    }
}