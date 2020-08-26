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
  completion: 'missing' | 'incomplete' | 'completed';
  aliases?: string[];
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

/**
 * The translation object allows lazy translation of messages.
 */
export class Translation {
  public key: string;
  public args?: { [x: string]: any };
  constructor(key: string, args: { [x: string]: any } | undefined) {
    this.key = key;
    this.args = args;
  }
}

export default class Language {
  /** A list of contributors by their user ID on Discord */
  public contributors: string[];

  /** The translator */
  public translator: string;

  /** The percentage that the language is completed */
  public completion: LanguageStatus;

  /** Any additional aliases to set the locale as */
  public aliases: string[];

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
  constructor(info: LanguageInfo) {
    this.contributors = info.contributors;
    this.translator = info.translator;
    this.completion = getStatus(info.completion);
    this.aliases = info.aliases || [];
    this.strings = info.strings;
    this.code = info.code;
    this.flag = info.flag;
    this.full = info.full;
  }

  get percentage(): number {
    switch (this.completion) {
      case LanguageStatus.Incomplete: return 50;
      case LanguageStatus.Completed: return 100;
      case LanguageStatus.Missing: return 0;
      default: return 0;
    }
  }

  /**
   * Translates the language and return the string
   * @param key The language key itself
   * @param args Any additional arguments to parse
   */
  translate(key: string, args?: { [x: string]: any }): string {
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

  lazyTranslate(translation: Translation): string {
    return this.translate(translation.key, translation.args);
  }

  private _translate(translated: string, args?: { [x: string]: string }) {
    const KEY_REGEX = /[$]\{([\w\.]+)\}/g;
    return translated.replace(KEY_REGEX, (_, key) => {
      if (args) {
        const value = String(args[key]);

        // Ignore empty strings
        if (value === '') return '';
        else return value || '?';
      } else {
        return '?';
      }
    }).trim();
  }
}