import { Message, Guild, TextChannel, User, EmbedOptions, Member } from 'eris';
import MessageCollector from './MessageCollector';
import ArgumentParser from './parsers/ArgumentParser';
import FlagParser from './parsers/FlagParser';
import NinoClient from './Client';

export interface DMOptions {
    user: User;
    content: string;
    embed?: EmbedOptions;
}
export default class CommandContext {
    public client: NinoClient;
    public message: Message;
    public args: ArgumentParser;
    public flags: FlagParser;
    public collector: MessageCollector;
    public guild: Guild;
    public sender: User;
    public me: Member;

    constructor(client: NinoClient, m: Message, args: string[]) {
        Object.assign<this, Message>(this, m);

        this.client    = client;
        this.message   = m;
        this.args      = new ArgumentParser(args);
        this.flags     = new FlagParser(args);
        this.guild     = (m.channel as TextChannel).guild;
        this.sender    = m.author;
        this.collector = new MessageCollector(client);
        this.me        = this.guild.members.get(client.user.id)!;
    }

    send(content: string) {
        return this.message.channel.createMessage(content);
    }

    embed(content: EmbedOptions) {
        return this.message.channel.createMessage({
            embed: content
        });
    }

    code(lang: string, content: string) {
        const cb = '```';
        return this.send(`${cb}${lang}\n${content}${cb}`);
    }

    async dm(options: DMOptions) {
        const channel = await options.user.getDMChannel();
        return channel.createMessage({
            content: options.content,
            embed: options.embed
        });
    }
}