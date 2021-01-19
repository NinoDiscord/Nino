import { mkdirSync, existsSync, appendFileSync, unlinkSync, writeFileSync } from 'fs';
import { sep, join } from 'path';
import { inspect } from 'util';
import leeks from 'leeks.js';

type LogMessage = (string | object | any[])[];
enum LogLevel {
  INFO,
  WARN,
  ERROR,
  REDIS,
  DEBUG,
  DATABASE
}

enum LogSeverity {
  NONE,
  ERROR
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

  private initialize() {
    if (!existsSync(this.logPath)) mkdirSync(this.logPath);
    if (existsSync(join(this.logPath, 'Nino.log'))) {
      unlinkSync(join(this.logPath, 'Nino.log'));
      writeFileSync(join(this.logPath, 'Nino.log'), '');
    }
  }

  private strip(message: string) {
    return message.replace(/\u001b\[.*?m/g, '');
  }

  private write(level: LogLevel, severity: LogSeverity, ...message: LogMessage) {
    let lvlText!: string;
    switch (level) {
      case LogLevel.INFO: {
        lvlText = this.colors.cyan(`[INFO/${process.pid}]`);
      } break;

      case LogLevel.WARN: {
        lvlText = this.colors.yellow(`[WARN/${process.pid}]`);
      } break;

      case LogLevel.ERROR: {
        lvlText = this.colors.red(`[ERROR/${process.pid}]`);
      } break;

      case LogLevel.REDIS: {
        lvlText = leeks.hex('#D82C20', `[REDIS/${process.pid}]`);
      } break;

      case LogLevel.DEBUG: {
        lvlText = leeks.hex('#987DC5', `[DEBUG/${process.pid}]`);
      } break;

      case LogLevel.DATABASE: {
        lvlText = leeks.rgb([88, 150, 54], `[MONGODB/${process.pid}]`);
      } break;
    }

    const msg = message.map(m => m instanceof Array ? `[${m.join(', ')}]` : m instanceof Object ? inspect(m) : m as string).join('\n');
    appendFileSync(`${this.logPath}${sep}Nino.log`, `${this.getDate()} ${this.strip(lvlText)} -> ${this.strip(msg)}\n`);

    const output = severity === LogSeverity.ERROR ? process.stderr : process.stdout;
    output.write(`${this.colors.gray(this.getDate())} ${lvlText} <=> ${msg}\n`);
  }

  info(...message: LogMessage) {
    this.write(LogLevel.INFO, LogSeverity.NONE, ...message);
  }

  warn(...message: LogMessage) {
    this.write(LogLevel.WARN, LogSeverity.NONE, ...message);
  }

  error(...message: LogMessage) {
    this.write(LogLevel.ERROR, LogSeverity.ERROR, ...message);
  }

  redis(...message: LogMessage) {
    this.write(LogLevel.REDIS, LogSeverity.NONE, ...message);
  }

  debug(...message: LogMessage) {
    if (process.env.NODE_ENV !== 'development') return;

    this.write(LogLevel.DEBUG, LogSeverity.NONE, ...message);
  }

  database(...message: LogMessage) {
    this.write(LogLevel.DATABASE, LogSeverity.NONE, ...message);
  }
}
