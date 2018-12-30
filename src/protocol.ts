import SocketIO from 'socket.io';

export class ExecutorProtocol {
    private server: SocketIO.Server;
    private _port: number = 2020;

    public constructor() {
        this.server = SocketIO();
        // TODO ping
        // TODO http-request
        // TODO http-response
        // TODO start
        // TODO stop
    }

    public async start(): Promise<any> {
        return new Promise((resolve: any, reject: any) => {
            try {
                this.server.listen(this.port);
                resolve();
            } catch (e) {
                reject();
            }
        });
    }

    get port(): number {
        return this._port;
    }
}
