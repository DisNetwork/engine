import express from 'express';

export class HTTPManager {
    private app: express.Application;
    private _port: number;

    public constructor() {
        this.app = express();
        this._port = 2030;
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
