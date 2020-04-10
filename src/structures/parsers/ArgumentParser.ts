export default class ArgumentParser {
  public args: string[];

  /**
   * Constructs a new instance of the argument parser utility
   * @param raw The raw arguments to use
   */
  constructor(raw: string[]) {
    this.args = [];

    for (let arg of raw) {
      if (!arg.startsWith('--')) this.args.push(arg);
      else break;
    }
  }

  /**
   * Gets the argument by indexing
   * @param i The index number to get from
   */
  get(i: number) {
    return this.args[i];
  }

  /**
   * Checks if the argument is empty
   * @param i The index number
   */
  has(i: number) {
    return !!this.args[i];
  }

  /**
   * Gathers all arguments into a string
   * @param sep The seperator
   */
  join(sep: string = ' ') {
    return this.args.join(sep);
  }

  /**
   * Slices the argument from the `start` to `end`
   * @param arg The argument number
   * @param start The start of the slicing process
   * @param end The end process
   */
  slice(start: number, end?: number) {
    return this.args.slice(start, end);
  }
}