import express from 'express';
import { MessageController, BotController } from './controller';
import { CoreOptions, post, get, del, Request, Response, put, patch, head } from 'request';
import { wait } from './until';
import { parse, UrlWithStringQuery } from 'url';

export class HTTPRequest {
    public done: boolean = false;
    public error: Error | undefined;
    public request: Request | undefined;
    public response: Response | undefined;
    public body: any | undefined;

    public constructor(
        private type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD',
        private _url: string,
        private timeout: number,
        private options: CoreOptions,
        private tokenHeader: boolean,
        private token: string
    ) {
        const parsedUrl: UrlWithStringQuery = parse(this._url);
        // Protect bots from stealing their tokens by other hostnames
        if (parsedUrl.hostname !== "discordapp.com" && this.tokenHeader) {
            return;
        }
        if (tokenHeader) {
            options.headers = {
                Authorization: this.token
            };
        }
    }

    public async send(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            if (this.type === 'GET') {
                this.request = get(this.url, this.options, this.callback);
            } else if (this.type === 'POST') {
                this.request = post(this.url, this.options, this.callback);
            } else if (this.type === 'PUT') {
                this.request = put(this.url, this.options, this.callback);
            } else if (this.type === 'DELETE') {
                this.request = del(this.url, this.options, this.callback);
            } else if (this.type === 'PATCH') {
                this.request = patch(this.url, this.options, this.callback);
            } else if (this.type === 'HEAD') {
                this.request = head(this.url, this.options, this.callback);
            }
            while (this.timeout > 0) {
                if (this.done) {
                    break;
                }
                this.timeout -= 1;
                await wait(1);
            }
            if (this.done) {
                resolve(this);
            } else {
                if (this.request !== undefined) {
                    this.request.abort();
                    resolve(this);
                }
            }
        });
    }

    private callback(error: Error, response: Response, body: any): void {
        this.done = true;
        if (error) {
            this.error = error;
            return;
        }
        this.response = response;
        this.body = body;
    }

    get url(): string {
        return this._url;
    }

}

export class HTTPManager {
    private app: express.Application;

    public constructor(private _port: number) {
        this.app = express();
        this.app.use(this.middleware);
        this.app.use('/message', MessageController);
        this.app.use('/bot', BotController);
    }

    public middleware(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (req.headers.authorization) {
            (req as any).botId = req.headers.authorization;
        }
        if (req.headers["user-agent"]) {
            (req as any).appId = req.headers["user-agent"];
        }
        next();
    }

    public async start(): Promise<any> {
        return new Promise((resolve: any) => {
            this.app.listen(this._port, () => {
                resolve();
            });
        });
    }

    get port(): number {
        return this._port;
    }

}
