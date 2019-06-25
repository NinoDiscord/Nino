export default class FlagParser {
    public flags: string[];

    constructor(raw: string[]) {
        this.flags = raw;
    }

    /**
     * Parses all flags into an object
     */
    parse(): { [x: string]: string | true } {
        const parsed = {};
        this.flags.forEach((flag) => {
            if (!flag.includes('--')) return;
            parsed[flag.split('--')[1].split('=')[0].toLowerCase()] = (flag.includes('='))? flag.split('=')[1]: true;
        });

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
}