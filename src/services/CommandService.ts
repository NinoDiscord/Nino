/**
 * Copyright (c) 2019-2021 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { Message, TextChannel } from 'eris';
import type ArgumentResolver from '../structures/arguments/ArgumentResolver';
import { readdirSync, Ctor } from '@augu/utils';
import { Service, Inject } from '@augu/lilith';
import type NinoCommand from '../structures/Command';
import { Collection } from '@augu/collections';
import { Logger } from 'tslog';
import Database from '../components/Database';
import { join } from 'path';
import Discord from '../components/Discord';

import StringResolver from '../structures/resolvers/StringResolver';
import IntResolver from '../structures/resolvers/IntegerResolver';
import GuildEntity from '../entities/GuildEntity';
import Config from '../components/Config';
import UserEntity from '../entities/UserEntity';

export default class CommandService implements Service {
  public commandsExecuted: number = 0;
  private mentionRegex!: RegExp;
  public messagesSeen: number = 0;
  private resolvers: Collection<string, ArgumentResolver<any>> = new Collection();
  public commands: Collection<string, NinoCommand> = new Collection();
  public name = 'Commands';

  @Inject
  private config!: Config;

  @Inject
  private database!: Database;

  @Inject
  private logger!: Logger;

  @Inject
  private discord!: Discord;

  async load() {
    // Add in resolvers
    this.resolvers.set('string', new StringResolver());
    this.resolvers.set('int', new IntResolver());

    // Add in the message create event
    this.discord.client.on('messageCreate', this.handleCommand.bind(this));

    // Load in commands
    this.logger.info('Now loading in commands...');
    const files = readdirSync(join(__dirname, '..', 'commands'));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ctor: Ctor<any> = await import(file);
      const command: NinoCommand = new ctor.default!();

      this.commands.set(command.name, command);
      this.logger.info(`Initialized command ${command.name}`);
    }

    this.logger.info(`Loaded ${this.commands.size} commands!`);
  }

  private async handleCommand(msg: Message<TextChannel>) {
    this.messagesSeen++;
    if (msg.author.bot) return;

    if (![0, 5].includes(msg.channel.type))
      return msg.channel.createMessage(`[ <:xmark:464708589123141634> **~** ${msg.author.username}#${msg.author.discriminator} ]\nCommands cannot be ran in a non-textable channel, please run a command in a guild.`);

    if (!this.mentionRegex)
      this.mentionRegex = new RegExp(`^<@!?${this.discord.client.user.id}> `);

    let guildSettings = await this.database.guilds.findOne({ guildID: msg.channel.guild.id });
    let userSettings = await this.database.users.findOne({ id: msg.author.id });

    if (!guildSettings) {
      const entity = new GuildEntity();
      entity.prefixes = [];
      entity.language = 'en_US';
      entity.guildID = msg.channel.guild.id;

      await this.database.guilds.save(entity);
      guildSettings = entity;
    }

    if (!userSettings) {
      const entry = new UserEntity();
      entry.prefixes = [];
      entry.language = 'en_US';
      entry.id = msg.author.id;

      await this.database.users.save(entry);
      userSettings = entry;
    }

    if ((new RegExp(`^<@!?${this.discord.client.user.id}>$`)).test(msg.content)) {
      const prefixes = ([] as string[]).concat(
        guildSettings!.prefixes,
        userSettings!.prefixes,
        this.config.getProperty('prefixes')!
      );

      if (this.discord.client.user.id === '531613242473054229')
        prefixes.push('nino ');

      return msg.channel.createMessage({
        content: `[ :wave: **~** ${msg.author.username}#${msg.author.discriminator} ]`,
        embed: {
          description: `I am **${this.discord.client.user.username}**! If you want to learn more about me, visit <https://nino.floofy.dev> for more information.`,
          color: 0xDAA2C6
        }
      });
    }
  }
}

/*
    const mentionRegex = new RegExp(`^<@!?${this.bot.client.user.id}> `);

    if ((new RegExp(`^<@!?${this.bot.client.user.id}>$`)).test(m.content)) {
      const user = await this.bot.userSettings.getOrCreate(m.author.id);
      const settings = await this.bot.settings.getOrCreate(guild.id);
      const locale = user === null ? this.bot.locales.get(settings.locale)! : user.locale === 'en_US' ? this.bot.locales.get(settings.locale)! : this.bot.locales.get(user.locale)!;
      const prefixes = [settings.prefix, this.bot.config.discord.prefix, `<@!${this.bot.client.user.id}>`];

      if (this.bot.client.user.id === '') prefixes.push('nino ');

      const embed = createEmptyEmbed()
        .setTitle(locale.translate('events.mentions.title', { user: `${m.author.username}#${m.author.discriminator}` }))
        .setDescription(locale.translate('events.mentions.description', {
          username: this.bot.client.user.username,
          guild: m.channel.guild.name,
          prefix: settings.prefix,
          prefixes: prefixes.filter((value, index) => prefixes.indexOf(value) === index).join(', '),
          random: prefixes[Math.floor(Math.random() * prefixes.length)],
          server: 'https://discord.gg/JjHGR6vhcG',
          invite: `https://discord.com/oauth2/authorize?client_id=${this.bot.client.user.id}&scope=bot`
        }));

      return m.channel.createMessage({
        embed: embed.build(),
        allowedMentions: {
          everyone: false,
          roles: false,
          users: false
        }
      });
    }
*/
