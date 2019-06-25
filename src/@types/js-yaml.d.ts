// Project Typings for package: "js-yaml"
// Revision'd from @types/js-yaml but more cleaner and "strongly" typed
// Project: nodeca/js-yaml
// Typings based on: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/js-yaml/index.d.ts

declare namespace YAML {
    /**
     * only Strings, Arrays, and Plain Objects (http://www.yaml.org/spec/1.2/spec.html#id2802346)
     */
    export const FAILSAFE_SCHEMA: YAML.Schema;

    /**
     * only Strings, Arrays, and Plain Objects (http://www.yaml.org/spec/1.2/spec.html#id2802346)
     */
    export const JSON_SCHEMA: YAML.Schema;

    /**
     * Clone of the JSON schema: http://www.yaml.org/spec/1.2/spec.html#id2804923 
     */
    export const CORE_SCHEMA: YAML.Schema;

    /**
     * All supported types without unsafe ones (`!!js/undefined`, `!!js/regexp`, aand `!!js/function`): http://yaml.org/type/
     */
    export const DEFAULT_SAFE_SCHEMA: YAML.Schema;

    /**
     * All supported YAML types
     */
    export const DEFAULT_FULL_SCHEMA: YAML.Schema;
    export const MINIMAL_SCHEMA: YAML.Schema;
    export const SAFE_SCHEMA: YAML.Schema;

    /**
     * Safe loads the current YAML path
     * @param path The path to get access
     * @param options Other additional options
     */
    export function safeLoad<T>(path: string, options?: YAML.LoadOptions): T;

    /**
     * Loads the current file
     * @param path The path to get access
     * @param options Other additional options
     */
    export function load<T>(path: string, options?: YAML.LoadOptions): T;

    /**
     * Safeloads all
     * @param path The path
     * @param iterator The iterator
     * @param options Any additional options
     */
    export function safeLoadAll(str: string, iterator?: undefined, options?: YAML.LoadOptions): any[];
    export function safeLoadAll<T>(str: string, iterator?: undefined, options?: YAML.LoadOptions): T[];
    export function safeLoadAll(str: string, iterator: (doc: any) => void, options?: YAML.LoadOptions): any[];
    export function safeLoadAll<T>(str: string, iterator: (doc: T) => void, options?: YAML.LoadOptions): T[];

    /**
     * Loads all
     * @param path The path
     * @param iterator The iterator
     * @param options Any additional options
     */
    export function loadAll(str: string, iterator?: undefined, options?: YAML.LoadOptions): any[];
    export function loadAll<T>(str: string, iterator?: undefined, options?: YAML.LoadOptions): T[];
    export function loadAll(str: string, iterator: (doc: any) => void, options?: YAML.LoadOptions): any[];
    export function loadAll<T>(str: string, iterator: (doc: T) => void, options?: YAML.LoadOptions): T[];

    /**
     * Safely dumps data
     * @param obj The object to dump
     * @param options Any additional options
     */
    export function safeDump(obj: any, options?: YAML.DumpOptions): string;
    export function safeDump<T>(obj: T, options?: YAML.DumpOptions): string;

    /**
     * Dumps data
     * @param obj The object to dump
     * @param options Any additional options
     */
    export function dump(obj: any, options?: YAML.DumpOptions): string;
    export function dump<T>(obj: T, options?: YAML.DumpOptions): string;

    export class Type {
        /**
         * Creates a new base instance of the `Type` class
         * @param tag The tag name
         * @param options Other additional options
         */
        constructor(tag: string, options?: YAML.TypeConstructorOptions);

        /**
         * The tag kind; it can be `sequence`, `scalar`, `mapping`, or `null`
         */
        public kind: 'sequence' | 'scalar' | 'mapping' | null;

        /**
         * The instance of object
         */
        public instanceOf: object | null;

        /**
         * The predicate function
         */
        public predicate: ((data: object) => boolean) | null;

        /**
         * The represent function or object
         */
        public represent: ((data: object) => any) | {
            [x: string]: (data: object) => any;
        } | null;

        /**
         * The default style to use
         */
        public defaultStyle: string | null;

        /**
         * Any style aliases
         */
        public styleAliases: { [x: string]: any; }

        /**
         * Resolves any packet of data
         * @param data The data packet
         */
        public resolve(data: any): boolean;

        /**
         * Constructs the type?
         * @param data The data
         */
        public construct(data: any): any;
    }

    export class Schema implements YAML.SchemaDefinition {
        constructor(definition: YAML.SchemaDefinition);

        /**
         * Creates a schema from any types
         * @param types The types to create from
         */
        public static create(types: YAML.Type | YAML.Type[]): Schema;

        /**
         * Creates a schema from a pre-existing schema and types
         * @param schemas Pre-existing schema(s)
         * @param types Pre-existing type(s)
         */
        public static create(schemas: YAML.Schema | YAML.Schema[], types: YAML.Type | YAML.Type[]): Schema;
    }

    export interface LoadOptions {
        /**
         * String to be used as a filepath in error/warning messages
         */
        filename?: string;

        /**
         * Base function to call on warning/error messages
         */
        onWarning?(this: null, e: YAML.YAMLException): void;

        /**
         * Specifies a schema to use
         */
        schema?: YAML.SchemaDefinition;

        /**
         * Compability with `JSON#parse` behaviour
         */
        json?: boolean;
    }

    export interface DumpOptions {
        /**
         * Indentation width to use (in number of spaces)
         */
        indent?: number;

        /**
         * When `noArrayIndent` is true, it'll not add an indentation level to array-based elements
         */
        noArrayIndent?: boolean;

        /**
         * Doesn't throw on invalid types (like functions in safe schema) and skip pairs and single values with such types.
         */
        noSkipInvalid?: boolean;

        /**
         * Specifices the level of nesting; when switched from block to flow style for collections.
         * 
         * `-1` means block styles are everywhere
         */
        flowLevel?: number;

        /**
         * Definition to customize tag styles
         * 
         * @example
         * 
         * ```js
         * YAML.dump({ i: 'yeet' }, { styles: {
         *   tag: 'style'
         * } });
         * ```
         */
        styles?: { [x: string]: any }

        /**
         * Specifices the schema to use
         */
        schema?: YAML.SchemaDefinition;

        /**
         * If `sortKeys` is true, all sort keys when dumped YAML. If a function is present, use the function to sort all keys (default: `false`)
         */
        sortKeys?: boolean | ((a: any, b: any) => number);

        /**
         * Sets the max line width (default: `80`)
         */
        lineWidth?: number;

        /**
         * If `noRefs` are true, it doesn't conver duplicate objects into references (default: `false`)
         */
        noRefs?: boolean;

        /**
         * If `noCompatMode` is true, it doesn't try to be compatile with older YAML versions
         * 
         * Currently: Don't quote `"yes"` or `"no"` and so on; required for YAML 1.1
         */
        noCompatMode?: boolean;

        /**
         * If `condenseFlow` is true, all flow sequences will be condensed; omitting spaces between `key: value` or `a, b`.
         * E.g `'[a,b]'` or `{a:{b:c}}`
         * 
         * This option is useful when using YAML for pretty URL query paramaters as spaces are `%-encoded`.
         */
        condenseFlow?: boolean;
    }

    export interface TypeConstructorOptions {
        /**
         * The tag kind; it can be `sequence`, `scalar`, `mapping`, or `null`
         */
        kind?: 'sequence' | 'scalar' | 'mapping';

        /**
         * The instance of object
         */
        instanceOf?: object;

        /**
         * The predicate function
         */
        predicate?: (data: object) => boolean;

        /**
         * The represent function
         */
        repesent?: (data: object) => any;

        /**
         * The default style to use
         */
        defaultStyle?: string;

        /**
         * Any style aliases
         */
        styleAliases?: { [x: string]: any };

        /**
         * The resolve function
         * @param data The data
         */
        resolve?: (data: any) => boolean;

        /**
         * Constructor
         * @param data The data
         */
        construct?: (data: any) => any;
    }

    export interface SchemaDefinition {
        implicit?: any[];
        explicit?: YAML.Type[];
        include?: YAML.Schema[];
    }

    export class YAMLException extends Error {
        constructor(reason?: any, mark?: any);
        toString(compat?: boolean): string;
    }
}

export = YAML;