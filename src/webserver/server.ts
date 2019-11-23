import Command from '../structures/Command';
import express from 'express';
import Client from '../structures/Client';

export default class NinoWebServer {
    public app: express.Application = express();
    public client: Client;
    public responses: string[] = [
        'Hello, why are you here? No one said you\'re allowed here.',
        'W-what?! How did you get here?? Isn\'t this IP address locked away from the developers? H-huh?!',
        'H-hello, why are you here? You\'re an developer, r-right? If not, please report this!!'
    ];

    constructor(client: Client) {
        this.client = client;
    }

    getCommands() {
        const array: Command[] = [];
        //* todo: A better fix :^)
        this.client.manager.commands.map(s => array.push(s));

        return array;
    }

    start() {
        this.app.get('/', (_, res) => res.status(200).send(this.responses[Math.floor(Math.random() * this.responses.length)]));
        this.app.get('/commands', (_, res) => res.status(200).json({ success: true, data: this.getCommands() }));
        this.app.get('/commands/:cmd', (req, res) => {
            const q = req.query['cmd'];
            const cmd = this.client.manager.commands.get(q);
            if (cmd === undefined) res.status(500).json({ success: false, message: 'Command was not found.' });
            res.status(200).json({ success: true, data: cmd! });
        });

        this.app.listen(this.client.config.webserver, () => this.client.logger.log('info', `Web server listening on ${this.client.config.webserver}~`));
    }
}