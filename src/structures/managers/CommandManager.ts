import { inject, injectable, multiInject } from 'inversify';
import { Collection } from '@augu/immutable';
import CommandService from '../services/CommandService';
import { TYPES } from '../../types';
import Command from '../Command';
import Bot from '../Bot';
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
  constructor(@inject(TYPES.Bot) bot: Bot, @inject(TYPES.CommandService) service: CommandService, @multiInject(TYPES.Command) commands: Command[]) {
    this.bot = bot;
    this.service = service;
    for (let command of commands) {
      this.commands.set(command.name, command);
      if (
        (this.bot.config.disabledCommands || []).includes(command.name) ||
        (this.bot.config.disabledCategories || []).includes(command.category)
      ) command.disabled = true;
    }
  }

  /**
   * Returns the command matching the name given
   * @param name the name or alias of the command
   */
  getCommand(name: string): Command | undefined {
    return this.commands.filter(
      c => c.name === name || c.aliases!.includes(name)
    )[0];
  }
}
