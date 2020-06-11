import { Message, TextChannel, User, EmbedOptions } from 'eris';
import { unembedify } from '../util';
import ArgumentParser from './parsers/ArgumentParser';
import FlagParser from './parsers/FlagParser';
import Bot from './Bot';
import Language from './Language';
import GuildSettings from './settings/GuildSettings';
import { GuildModel } from '../models/GuildSchema';

export interface DMOptions {
  user: User;
  content: string;
  embed?: EmbedOptions;
}

export default class CommandContext {
  public bot: Bot;
  public message: Message;
  public args: ArgumentParser;
  public flags: FlagParser;
  public locale: Language | undefined;
  public settings: GuildModel | undefined;

  constructor(bot: Bot, m: Message, args: string[], locale: Language | undefined, settings: GuildModel | undefined) {
    this.bot = bot;
    this.message = m;
    this.args = new ArgumentParser(args);
    this.flags = new FlagParser(args);
    this.locale = locale;
    this.settings = settings;
  }

  send(content: string) {
    return this.message.channel.createMessage(content);
  }

  embed(content: EmbedOptions) {
    return this.message.channel.createMessage({ embed: content });
  }

  code(lang: string, content: string) {
    const cb = '```';
    return this.send(`${cb}${lang}\n${content}${cb}`);
  }

  get client() {
    return this.bot.client;
  }

  get guild() {
    return (this.message.channel instanceof TextChannel) ? 
      (this.message.channel as TextChannel).guild : 
      undefined;
  }

  get channel() {
    return this.message.channel;
  }

  get sender() {
    return this.message.author;
  }

  get member() {
    return this.guild ? this.guild.members.get(this.sender.id) : undefined;
  }

  get me() {
    return this.guild!.members.get(this.bot.client.user.id)!;
  }

  getSettings() {
    return this.guild ? this.bot.settings.getOrCreate(this.guild.id) : null;
  }

  translate(key: string, args?: { [x: string]: any }): string {
    return this.locale ? this.locale.translate(key, args) : 'Failed translation.';
  }

  async sendTranslate(key: string, args?: { [x: string]: any }) {
    return this.send(this.translate(key, args));
  }

  get redis() {
    return this.bot.redis;
  }

  async dm(options: DMOptions) {
    const channel = await options.user.getDMChannel();
    return channel.createMessage({
      content: options.content,
      embed: options.embed,
    });
  }
}
