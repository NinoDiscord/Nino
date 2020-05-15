import Bot from './Bot';

enum LanguageStatus {
  Incomplete = 'incomplete',
  Completed = 'completed',
  Missing = 'missing'
}

/** Interface of the information the JSON structure will be like */
interface LanguageInfo {
  contributors: string[];
  translator: string;
  completed: 'missing' | 'incomplete' | 'completed';
  code: string;
  flag: string;
  full: string;
  strings: {
    [x: string]: string | object;
  }
}

function getStatus(type: 'missing' | 'incomplete' | 'completed') {
  switch (type) {
    case 'incomplete': return LanguageStatus.Incomplete;
    case 'completed': return LanguageStatus.Completed;
    case 'missing': return LanguageStatus.Missing;
    default: return LanguageStatus.Missing;
  }
}

export default class Language {
  /** A list of contributors by their user ID on Discord */
  public contributorIDs: string[];

  /** The translator */
  public translatorID: string;

  /** The percentage that the language is completed */
  public completion: LanguageStatus;

  /** The language strings itself */
  public strings: { [x: string]: string | object };

  /** The code (ex: `en_US`) */
  public code: string;

  /** The flag */
  public flag: string;

  /** The full language name */
  public full: string;

  /**
   * Construct a new instance of `Language`
   * @param bot The bot instance
   * @param info The information
   */
  constructor(private bot: Bot, info: LanguageInfo) {
    this.contributorIDs = info.contributors;
    this.translatorID = info.translator;
    this.completion = getStatus(info.completed);
    this.strings = info.strings;
    this.code = info.code;
    this.flag = info.flag;
    this.full = info.full;
  }

  get translator() {
    return this.bot.client.users.get(this.translatorID);
  }

  get percentage(): number {
    switch (this.completion) {
      case LanguageStatus.Incomplete: return 50;
      case LanguageStatus.Completed: return 100;
      case LanguageStatus.Missing: return 0;
      default: return 0;
    }
  }

  get contributors() {
    return this.contributorIDs.map(x => this.bot.client.users.get(x)!);
  }

  /**
   * Translates the language and return the string
   * @param key The language key itself
   * @param args Any additional arguments to parse
   */
  translate(key: string, args?: { [x: string]: any }) {
    const nodes = key.split('.');
    let translated: any = this.strings;

    for (const fragment of nodes) {
      try {
        translated = translated[fragment];
      } catch {
        translated = null;
        break;
      }
    }

    if (translated === null) return `Key "${key}" was not found.`;
    if (typeof translated === 'object' && !Array.isArray(translated)) return `Key "${key}" is an object!`;

    if (Array.isArray(translated)) return (translated as string[]).map(x => this._translate(x, args)).join('\n');
    else return this._translate(translated, args);
  }

  private _translate(translated: string, args?: { [x: string]: string }) {
    const KEY_REGEX = /[$]\{\s*([\w\.]+)\}\s*/g;
    return translated.replace(KEY_REGEX, (selector) => {
      const key = selector.slice(2, selector.length - 1);
      return args ? args.hasOwnProperty(key) ? args[key] : '?' : '?';
    });
  }
}