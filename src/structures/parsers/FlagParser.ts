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
        if (!this.flags.includes('--')) return {};

        for (let flag of this.flags.split('--').slice(1)) {
            if (flag === '' || !flag.includes('=') || flag[0] === '=' || flag[flag.length-1] === '=') continue;
            const a = flag.split('=')[0];
            const b = flag.slice(flag.indexOf('=') + 1);
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
}