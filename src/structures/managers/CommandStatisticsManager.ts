import { inject, injectable } from 'inversify';
import NinoCommand from '../Command';
import { TYPES } from '../../types';
import Bot from '../Bot';

interface CommandUsage {
  command: string;
  uses: number;
}

@injectable()
export default class CommandStatisticsManager {
  public commandsExecuted: number;
  public commandUsages: { [x: string]: number; };
  public messagesSeen: number;
  public guildCount: number;
  public bot: Bot;

  constructor(
    @inject(TYPES.Bot) bot: Bot
  ) {
    this.commandsExecuted = 0;
    this.commandUsages = {};
    this.messagesSeen = 0;
    this.guildCount = 0;
    this.bot = bot;
  }

  getCommandUsages(): CommandUsage {
    if (Object.keys(this.commandUsages).length) {
      const command = Object.keys(this.commandUsages)
        .map(key => ({
          key,
          uses: this.commandUsages[key]
        })).sort((first, second) => first.uses - second.uses)[0];

      return {
        command: command.key,
        uses: command.uses
      };
    } else {
      return {
        command: 'None',
        uses: 0
      };
    }
  }

  increment(cmd: NinoCommand) {
    if (!this.commandUsages.hasOwnProperty(cmd.name)) this.commandUsages[cmd.name] = 0;

    if (['eval', 'shell', 'profiler'].includes(cmd.name)) {
      this.commandsExecuted++;
      delete this.commandUsages[cmd.name];
    } else {
      this.commandsExecuted++;
      this.commandUsages[cmd.name]++;
    }
  }
}