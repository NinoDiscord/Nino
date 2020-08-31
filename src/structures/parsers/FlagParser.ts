export default class FlagParser {
  public flags: string;

  constructor(raw: string[]) {
    this.flags = raw.join(' ');
  }

  /**
   * Parses all flags into an object
   */
  parse(): { [x: string]: string | true } {
    const parsed = {};
    if (!this.flags.includes('-')) return {};

    const flagPartitioned = this.flags
      .split('-')
      .filter((x, i) => i == 0 || x !== '');
    for (let flag of flagPartitioned.slice(1)) {
      if (
        !flag.includes('=') ||
        flag[0] === '=' ||
        flag[flag.length - 1] === '='
      ) {
        parsed[flag.split(' ').filter((x, i) => i == 0 || x !== '')[0]] = true;
        continue;
      }
      const a = flag.split(/\s*=\s*/)[0];
      const b = flag.slice(flag.indexOf('=') + 1).trim();
      parsed[a] = b;
    }
    return parsed;
  }

  /**
   * Gets the flag
   * @param flag The flag to get
   */
  get(flag: string) {
    const flags = this.parse();
    return flags[flag];
  }

  /**
   * Check if a flag is supplied
   * @param flag The flag
   */
  has(flag: string) {
    const flags = this.parse();
    return flags.hasOwnProperty(flag);
  }
}