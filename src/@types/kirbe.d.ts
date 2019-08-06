declare module 'kirbe' {
    // Modules to import
    import http from 'http';
    import { URL } from 'url';

    // Unexported Types
    type Middleware = (req: Request, res: Response, next?: () => void) => void;
    class Request {
        constructor(req: http.IncomingMessage, body: string);
        public url: string;
        public req: http.IncomingMessage;
        public body: string;
        public from: string;
        public method: string;
        public headers: http.IncomingHttpHeaders;
        public parsedUrl: URL;
        public json(): { [x: string]: any };
        public query(name: string): any;
    }

    class Response {
        constructor(res: http.ServerResponse);
        public coreRes: http.ServerResponse;
        public headers: { [x: string]: string }
        public statusCode: number;
        public statusMessage: string | null;
        public data: Buffer;
        public body(body: string | object | Buffer): this;
        public header(key: string | object, value?: string): this;
        public status(code: number, message?: string | null): this;
        public end(data?: string | object | Buffer): this;
    }

    // Exported types
    export function Static(baseDir: string, indexFile?: string): Middleware;
    export class Server {
        constructor();
        public get(route: string, cb: (req: Request, res: Response) => void): void;
        public post(route: string, cb: (req: Request, res: Response) => void): void;
        public listen(port: number, host?: string | (() => void)): void;
    }
}