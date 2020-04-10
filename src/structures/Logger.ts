import { mkdirSync, existsSync, appendFileSync } from 'fs';
import { inspect } from 'util';
import { sep } from 'path';
import leeks from 'leeks.js';

type LoggerMessage = (string | object)[];
enum LogLevel {
  INFO,
  WARN,
  ERROR,
  REDIS,
  DATABASE
}

export default class Logger {
  public logPath: string = `${process.cwd()}${sep}data`;
  public colors: typeof leeks.colors = leeks.colors;

  constructor() {
    this.initialize();
  }

  getDate() {
    const now = new Date();

    const seconds = `0${now.getSeconds()}`.slice(-2);
    const minutes = `0${now.getMinutes()}`.slice(-2);
    const hours = `0${now.getHours()}`.slice(-2);
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';

    return `[${hours}:${minutes}:${seconds} ${ampm}]`;
  }

  initialize() {
    if (!existsSync(this.logPath)) mkdirSync(this.logPath);
  }

  strip(message: string) {
    return message.replace(/\u001b\[.*?m/g, '');
  }

  private write(level: LogLevel, ...message: LoggerMessage) {
    let lvlText!: string;
    switch (level) {
      case LogLevel.INFO: {
        lvlText = this.colors.bgMagenta(this.colors.black(`[INFO/${process.pid}]`));
      } break;

      case LogLevel.WARN: {
        lvlText = this.colors.bgYellow(this.colors.black(`[WARN/${process.pid}]`));
      } break;

      case LogLevel.ERROR: {
        lvlText = this.colors.bgRed(`[ERROR/${process.pid}]`);
      } break;

      case LogLevel.REDIS: {
        lvlText = leeks.hexBg('#D82C20', `[REDIS/${process.pid}]`);
      } break;

      case LogLevel.DATABASE: {
        lvlText = leeks.rgbBg([88, 150, 54], this.colors.black(`[MONGODB/${process.pid}]`));
      } break;
    }

    const msg = message.map(m =>
      m instanceof Object ? inspect(m) : m  
    ).join('\n');

    appendFileSync(`${this.logPath}${sep}Nino.log`, `${this.getDate()} ${this.strip(lvlText)} -> ${this.strip(msg)}\n`);
    process.stdout.write(`${this.colors.bgGray(this.getDate())} ${lvlText} -> ${msg}\n`);
  }

  info(...message: LoggerMessage) {
    this.write(LogLevel.INFO, ...message);
  }

  warn(...message: LoggerMessage) {
    this.write(LogLevel.WARN, ...message);
  }

  error(...message: LoggerMessage) {
    this.write(LogLevel.ERROR, ...message);
  }

  redis(...message: LoggerMessage) {
    this.write(LogLevel.REDIS, ...message);
  }

  database(...message: LoggerMessage) {
    this.write(LogLevel.DATABASE, ...message);
  }
}