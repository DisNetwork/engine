import express from 'express';
import { MessageController, BotController } from './controller';

export class HTTPManager {
    private app: express.Application;

    public constructor(private _port: number) {
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
