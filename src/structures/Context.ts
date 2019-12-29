import {
  Message,
  Guild,
  TextChannel,
  User,
  EmbedOptions,
  Member,
  Client,
  TextableChannel,
} from 'eris';
import MessageCollector from './MessageCollector';
import ArgumentParser from './parsers/ArgumentParser';
import FlagParser from './parsers/FlagParser';
import Bot from './Bot';
import { GuildModel } from '../models/GuildSchema';
import IORedis = require('ioredis');

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
  public collector: MessageCollector;

  constructor(bot: Bot, m: Message, args: string[]) {
    this.bot = bot;
    this.message = m;
    this.args = new ArgumentParser(args);
    this.flags = new FlagParser(args);
    this.collector = new MessageCollector(bot.client);
  }

  send(content: string) {
    return this.message.channel.createMessage(content);
  }

  embed(content: EmbedOptions) {
    return this.message.channel.createMessage({
      embed: content,
    });
  }

  code(lang: string, content: string) {
    const cb = '```';
    return this.send(`${cb}${lang}\n${content}${cb}`);
  }

  get client(): Client {
    return this.bot.client;
  }

  get guild(): Guild | undefined {
    if (!(this.message.channel instanceof TextChannel)) {
      return undefined;
    }
    return (this.message.channel as TextChannel).guild;
  }

  get channel(): TextableChannel {
    return this.message.channel;
  }

  get sender(): User {
    return this.message.author;
  }

  get member(): Member | undefined {
    if (this.guild) {
      return this.guild.members.get(this.sender.id);
    }
  }

  get me(): Member {
    return this.guild!.members.get(this.bot.client.user.id)!;
  }

  get settings(): Promise<GuildModel> {
    if (this.guild) return this.bot.settings.getOrCreate(this.guild.id);
    return Promise.reject('not in a guild');
  }

  get redis(): IORedis.Redis {
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
