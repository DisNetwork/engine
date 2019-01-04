import express from 'express';
import { MessageController, BotController, GuildController } from './controller';
import request from 'request';
import { wait } from './until';
import { parse, UrlWithStringQuery } from 'url';
import { json, urlencoded } from 'body-parser';
import { ExecutorManager } from './protocol';

export class HTTPRequest {
    public done: boolean = false;
    public error: Error | undefined;
    public request: request.Request | undefined;
    public response: request.Response | undefined;
    public body: any | undefined;

    public constructor(
        private type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD',
        private url: string,
        private timeout: number,
        private options: request.CoreOptions,
        private tokenHeader: boolean,
        private token: string
    ) {
        const parsedUrl: UrlWithStringQuery = parse(this.url);
        // Protect bots from stealing their tokens by other hostnames
        const execM: ExecutorManager = ExecutorManager.instance;
        if ((parsedUrl.hostname !== "discordapp.com" && parsedUrl.hostname !== 'localhost') && this.tokenHeader) {
            return;
        }
        if (tokenHeader) {
            options.headers = {
                "Authorization": "Bot " + this.token,
                "Content-Type": "application/json"
            };
        }
    }

    public async send(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const url: string = this.url;
            if (this.options.body) {
                this.options.body = JSON.stringify(this.options.body);
            }
            const requestOptions: request.CoreOptions = {
                method: this.type
            };
            for (const option in this.options) {
                (requestOptions as any)[option] = (this.options as any)[option];
            }
            this.request = request(url, requestOptions, this.callback);
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

    private callback(error: Error, response: request.Response, body: any): void {
        this.done = true;
        if (error) {
            this.error = error;
            return;
        }
        this.response = response;
        this.body = body;
    }

}

export class HTTPManager {
    private app: express.Application;

    public constructor(private _port: number) {
        this.app = express();
        this.app.use(json());
        this.app.use(urlencoded({extended: true}));
        this.app.use(this.middleware);
        this.app.use('/message', MessageController);
        this.app.use('/bot', BotController);
        this.app.use('/guild', GuildController);
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
