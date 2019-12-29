import { Collection } from '@augu/immutable';
import CommandService from '../services/CommandService';
import Command from '../Command';
import { sep } from 'path';
import Bot from '../Bot';
import { inject, injectable, multiInject } from 'inversify';
import { TYPES } from '../../types';
import 'reflect-metadata';

@injectable()
export default class CommandManager {
  public bot: Bot;
  public service: CommandService;
  public commands: Collection<Command> = new Collection();

  /**
   * Creates a new instance of the `CommandManager`
   * @param bot The client instance
   */
  constructor(
    @inject(TYPES.Bot) bot: Bot,
    @inject(TYPES.CommandService) commandservice: CommandService,
    @multiInject(TYPES.Command) commands: Command[]
  ) {
    this.bot = bot;
    this.service = commandservice;
    for (let command of commands) {
      this.commands.set(command.name, command);
      if (
        (this.bot.config.disabledcmds || []).includes(command.name) ||
        (this.bot.config.disabledcats || []).includes(command.category)
      ) {
        command.disabled = true;
      }
    }
  }

  /**
   * Returns the command matching the name given
   * @param name the name or alias of the command
   */
  getCommand(name: string): Command | undefined {
    return this.bot.manager.commands.filter(
      c => c.name === name || c.aliases!.includes(name)
    )[0];
  }
}
