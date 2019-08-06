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
        if (!this.flags.includes('--') || !this.flags.includes('-')) return {};

        const flagPartitioned = (this.flags.includes('--'))? this.flags.split('--'): this.flags.split('-');
        for (let flag of flagPartitioned.slice(1)) {
            if (flag === '' || !flag.includes('=') || flag[0] === '=' || flag[flag.length-1] === '=') {
                parsed[flag.split(' ')[0]] = true;
                continue;
            }
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