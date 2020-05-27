import { Message, TextChannel, User, EmbedOptions } from 'eris';
import { unembedify } from '../util';
import ArgumentParser from './parsers/ArgumentParser';
import FlagParser from './parsers/FlagParser';
import Bot from './Bot';

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

  constructor(bot: Bot, m: Message, args: string[]) {
    this.bot = bot;
    this.message = m;
    this.args = new ArgumentParser(args);
    this.flags = new FlagParser(args);
  }

  send(content: string) {
    return this.message.channel.createMessage(content);
  }

  embed(content: EmbedOptions) {
    if (this.guild) {
      if (this.member!.clientStatus !== undefined && this.member!.clientStatus.mobile !== 'offline') {
        const message = unembedify(content);
        return this.send(message);
      } else if (!this.me.permission.has('embedLinks')) {
        const message = unembedify(content);
        return this.send(message);
      } else {
        return this.message.channel.createMessage({ embed: content });
      }
    } else {
      return this.message.channel.createMessage({ embed: content });
    }
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

  async getLocale() {
    const guild = await this.getSettings()!;
    const user = await this.bot.userSettings.getOrCreate(this.sender.id);

    return user.locale === 'en_US' 
      ? this.bot.locales.get(guild.locale)!
      : this.bot.locales.get(user.locale)!;
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
