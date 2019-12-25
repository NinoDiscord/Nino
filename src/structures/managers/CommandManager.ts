import { readdir, readdirSync } from 'fs';
import { Collection } from '@augu/immutable';
import CommandService from '../services/CommandService';
import Command from '../Command';
import { sep } from 'path';
import Bot from '../Bot';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import 'reflect-metadata';

@injectable()
export default class CommandManager {
  public bot: Bot;
  public service: CommandService;
  public path: string = `${process.cwd()}${sep}dist${sep}commands`;
  public commands: Collection<Command> = new Collection();

  /**
   * Creates a new instance of the `CommandManager`
   * @param bot The client instance
   */
  constructor(
    @inject(TYPES.Bot) bot: Bot,
    @inject(TYPES.CommandService) commandservice: CommandService
  ) {
    this.bot = bot;
    this.service = commandservice;
  }

  /**
   * Starts the command manager's process
   */
  async start() {
    const groups = await readdirSync(this.path);
    for (let i = 0; i < groups.length; i++) {
      const category = groups[i];
      readdir(`${this.path}${sep}${category}`, (error, files) => {
        if (error && !!error.stack) this.bot.logger.log('error', error.stack);
        this.bot.logger.log(
          'info',
          `Building ${files.length} command${files.length > 1 ? 's' : ''}`
        );
        files.forEach(file => {
          try {
            const command = require(`${this.path}${sep}${category}${sep}${file}`);
            const cmd: Command = new command.default(this.bot);
            if (
              (this.bot.config.disabledcmds || []).includes(cmd.name) ||
              (this.bot.config.disabledcats || []).includes(cmd.category)
            ) {
              cmd.disabled = true;
            }

            cmd.setParent(category, file);

            this.commands.set(cmd.name, cmd);
            this.bot.logger.log('info', `Initialized command ${cmd.name}!`);
          } catch (err) {
            this.bot.logger.log(
              'error',
              `Couldn't initialize command ${file}. Error: ${err}`
            );
          }
        });
      });
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
