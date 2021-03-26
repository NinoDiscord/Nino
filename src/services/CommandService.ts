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

import { Service, Inject, getInjectables } from '@augu/lilith';
import type { Message, TextChannel } from 'eris';
import type ArgumentResolver from '../structures/arguments/ArgumentResolver';
import { readdirSync, Ctor } from '@augu/utils';
import type NinoCommand from '../structures/Command';
import CommandHandler from '../structures/handlers/CommandHandler';
import CommandMessage from '../structures/CommandMessage';
import { Collection } from '@augu/collections';
import EmbedBuilder from '../structures/EmbedBuilder';
import UserEntity from '../entities/UserEntity';
import { Logger } from 'tslog';
import Database from '../components/Database';
import { join } from 'path';
import Discord from '../components/Discord';
import Config from '../components/Config';
import app from '../container';

// resolvers
import StringResolver from '../structures/resolvers/StringResolver';
import IntResolver from '../structures/resolvers/IntegerResolver';

export default class CommandService implements Service {
  public commandsExecuted: number = 0;
  public messagesSeen: number = 0;
  public resolvers: Collection<string, ArgumentResolver<any>> = new Collection();
  public cooldowns: Collection<string, Collection<string, number>> = new Collection();
  public commands: Collection<string, NinoCommand> = new Collection();
  private handler: CommandHandler = new CommandHandler(this);
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
    this._addResolvers();

    // Add injections to the command handler
    const injections = getInjectables(this.handler);
    app.inject(injections, this.handler);

    // Add in the message create and event
    this.discord.client.on('messageCreate', (msg: any) =>
      this.handler.handleCommand.call(this.handler, msg)
    );

    this.discord.client.on('messageUpdate', (msg: any, old) =>
      this.handler.onMessageEdit.call(this.handler, msg, old)
    );

    // Load in commands
    this.logger.info('Now loading in commands...');
    const files = readdirSync(join(__dirname, '..', 'commands'));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ctor: Ctor<any> = await import(file);
      const command: NinoCommand = new ctor.default!();

      // only the help command will have the `commands` prop to be this
      const injections = getInjectables(command);
      app.inject(injections.filter(inject => inject.property !== 'service'), command);

      // if it's the help command, let's inject it
      const injection = injections.filter(inject => inject.property === 'service')[0];
      if (injection !== undefined)
        app.inject([
          {
            property: 'service',
            ref: CommandService
          }
        ], command);

      // Arguments needs the resolvers, so this instance needs to be populated
      command.args.forEach(arg => {
        arg.service = this;
      });

      this.commands.set(command.name, command);
      this.logger.info(`Initialized command ${command.name}`);
    }

    this.logger.info(`Loaded ${this.commands.size} commands!`);
  }

  getArgumentResolver(type: string) {
    return this.resolvers.get(type)!;
  }

  private _addResolvers() {
    this.resolvers.set('string', new StringResolver());
    this.resolvers.set('int', new IntResolver());
  }
}
