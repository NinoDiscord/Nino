declare module 'pikmin' {
    import { WriteStream, PathLike } from "fs";

    /** The loggers collection */
    export const loggers: Collection<instance>;

    /** The version of Pikmin */
    export const version: string;

    /** The colors constant */
    export const colors: Colors;

    /**
     * Binds the transport's functions into `a` (default: NodeJS.Console)
     * @param i The instance to bind
     * @param a The class you wanna bind it to, the default is: NodeJS.Console
     * @param b Anything else to bind?
     */
    export function bind(i: instance, a?: Console, b?: any): void;

    /**
     * Unbinds Pikmin from the `NodeJS.Console` interface
     * @param i The instance
     */
    export function unbind(i: instance): void;

    /** The instance itself */
    export class instance {
        [x: string]: any;
        
        /**
         * Construct a new instance of the Pikmin instance
         * @param options The options to bind
         */
        constructor(options?: InstanceOptions);

        /** The log object */
        public log: {
            [x: string]: (m: string | object | string[]) => void;
        }

        /** The name of the instance */
        public name: string;

        /** The base format */
        public baseFormat: string;

        /** An array of transports */
        public transports: Transport[];

        /**
         * Adds a transport
         * @param transport The transport to add 
         * @param options Any options to bind
         */
        public addTransport(transport: Transport, options?: { autogen: boolean }): void;
    }

    export class Collection<T> extends Map<string | number, T> {
        public filter(i: (a: T) => boolean): T[];
        public map<R>(i: (a: T) => R): T[];
    }

    /** 
     * The console transport that logs anything to the terminal
     */
    export class ConsoleTransport implements Transport {
        constructor(options: InstanceOptions & { process: NodeJS.Process });

        /** The type of the transport, implemented by the Transport interface */
        public type: 'CONSOLE' | 'WEBHOOK' | 'FILE';

        /** The name of the transport, implemented by the Transport interface */
        public name: string;

        /** The parent of the transport, implemented by the Transport interface; resolves by `undefined` */
        public parent: any | undefined;

        /** The defaults of the transport, implemented by the Transport interface */
        public defaults: { inspect: boolean }

        /** The NodeJS.Process tty, only to use Stdout#write */
        public process: NodeJS.Process;
        append(options: { inspect: boolean }, data: string): void;
        destroy(): this;
    }

    export class FileTransport implements Transport {
        constructor(options: InstanceOptions & { file: string | PathLike, flags?: '-a' });

        /** The type of the transport, implemented by the Transport interface */
        public type: 'CONSOLE' | 'WEBHOOK' | 'FILE';

        /** The name of the transport, implemented by the Transport interface */
        public name: string;

        /** The parent of the transport, implemented by the Transport interface; resolves by `undefined` */
        public parent: any | undefined;

        /** The defaults of the transport, implemented by the Transport interface */
        public defaults: { inspect: boolean }

        /** The write stream */
        public stream: WriteStream;
        append(options: { inspect: boolean }, data: string): void;
        destroy(): this;
    }

    /** The colors interface, run by `colors` */
    export interface Colors {
        black: Color;
        red: Color;
        green: Color;
        yellow: Color;
        blue: Color;
        magenta: Color;
        cyan: Color;
        white: Color;
        bgBlack: Color;
        bgRed: Color;
        bgGreen: Color;
        bgYellow: Color;
        bgBlue: Color;
        bgCyan: Color;
        bgWhite: Color;
        blackBright: Color;
        redBright: Color;
        greenBright: Color;
        yellowBright: Color;
        blueBright: Color;
        magentaBright: Color;
        cyanBright: Color;
        whiteBright: Color;
        bgBlackBright: Color;
        bgRedBright: Color;
        bgGreenBright: Color;
        bgYellowBright: Color;
        bgBlueBright: Color;
        bgMagentaBright: Color;
        bgCyanBright: Color;
        bgWhiteBright: Color;
        reset: Color;
        bold: Color;
        dim: Color;
        italic: Color;
        underline: Color;
        blink: Color;
        inverse: Color;
        strikethrough: Color;
        hex: (hex: string) => string | undefined;
        rgb: (val: number[]) => string | undefined;
        convert: (value: string | number[], to: 'hex' | 'rgb') => string | number[] | undefined;
        strip: (val: string) => string;
        supported: boolean;
    }

    export interface InstanceOptions {
        name?: string;
        format?: string;
        autogen?: boolean;
        transports?: Transport[];
    }

    export interface Transport {
        type: 'CONSOLE' | 'WEBHOOK' | 'FILE';
        name: string;
        parent: any | undefined;
        defaults: {
            inspect: boolean
        }
        append(options: { inspect: boolean }, data: string): void;
        destroy(): this;
    }

    export type Color = (s: string | number | object) => string;
}