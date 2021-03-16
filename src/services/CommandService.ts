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
import { join } from 'path';
import Discord from '../components/Discord';

import StringResolver from '../structures/resolvers/StringResolver';
import IntResolver from '../structures/resolvers/IntegerResolver';

export default class CommandService implements Service {
  private resolvers: Collection<string, ArgumentResolver<any>> = new Collection();
  public commands: Collection<string, NinoCommand> = new Collection();
  public name = 'Commands';

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
    console.log(`${msg.content} by ${msg.author.username}#${msg.author.discriminator}`);
  }
}
