import { inject, injectable } from 'inversify';
import { Collection } from '@augu/immutable';
import NinoCommand from '../Command';
import { TYPES } from '../../types';
import Bot from '../Bot';

interface CommandUsage {
  command: string;
  size: number;
}

@injectable()
export default class CommandStatisticsManager {
  public commandsExecuted: number;
  public commandUsages: Collection<number>;
  public messagesSeen: number;
  public guildCount: number;
  public bot: Bot;

  constructor(
    @inject(TYPES.Bot) bot: Bot
  ) {
    this.commandsExecuted = 0;
    this.commandUsages = new Collection();
    this.messagesSeen = 0;
    this.guildCount = 0;
    this.bot = bot;
  }

  getCommandUsages(): CommandUsage {
    const keys = [...this.commandUsages.keys()];
    if (keys.length > 0) {
      const name = keys
        .map(s => {
          const usage = this.commandUsages.get(s)!;
          return {
            uses: usage,
            key: s
          };
        }).sort((a, b) => b.uses - a.uses)[0];

      return {
        command: name.key as string,
        size: name.uses
      };
    } 
    else {
      return {
        command: 'None',
        size: 0
      };
    }
  }

  increment(cmd: NinoCommand) {
    if (!this.commandUsages.has(cmd.name)) this.commandUsages.set(cmd.name, 0);
    if (['eval', 'shell'].includes(cmd.name)) {
      this.commandsExecuted++;
      this.commandUsages.delete(cmd.name);
    } 
    else {
      let usage = this.commandUsages.get(cmd.name)!;
      this.commandsExecuted++;
      this.commandUsages.set(cmd.name, usage++);
    }
  }
}