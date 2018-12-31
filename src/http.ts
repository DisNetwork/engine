import express from 'express';
import { MessageController, BotController } from './controller';

export class HTTPManager {
    private app: express.Application;
    private _port: number = 2030;

    public constructor() {
        this.app = express();
        this.app.use('/message', MessageController);
        this.app.use('/bot', BotController);
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
