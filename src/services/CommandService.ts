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
import { readdirSync, Ctor } from '@augu/utils';
import type NinoCommand from '../structures/Command';
import CommandHandler from '../structures/handlers/CommandHandler';
import { Collection } from '@augu/collections';
import { Logger } from 'tslog';
import { join } from 'path';
import Discord from '../components/Discord';
import app from '../container';

export default class CommandService implements Service {
  public commandsExecuted: number = 0;
  public messagesSeen: number = 0;
  public cooldowns: Collection<string, Collection<string, number>> = new Collection();
  public commands: Collection<string, NinoCommand> = new Collection();
  private handler: CommandHandler = new CommandHandler(this);
  public name = 'Commands';

  @Inject
  private logger!: Logger;

  @Inject
  private discord!: Discord;

  async load() {
    // Add injections to the command handler
    const injections = getInjectables(this.handler);
    app.inject(injections, this.handler);

    // Add in the message create and event
    this.discord.client.on('messageCreate', (msg: Message<TextChannel>) =>
      this.handler.handleCommand.call(this.handler, msg)
    );

    this.discord.client.on('messageUpdate', (msg: Message<TextChannel>, old) =>
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

      this.commands.set(command.name, command);
      this.logger.info(`Initialized command ${command.name}`);
    }

    this.logger.info(`Loaded ${this.commands.size} commands!`);
  }
}
