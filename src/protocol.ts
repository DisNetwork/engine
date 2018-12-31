import SocketIO from 'socket.io';

export class ExecutorProtocol {
    private server: SocketIO.Server;
    private socket: SocketIO.Socket | undefined;

    public constructor(private _port: number) {
        this.server = SocketIO();
        this.server.on('connection', (socket) => {
            if (this.socket !== undefined) {
                socket.disconnect(true);
            }
            this.socket = socket;
            socket.on('ping', this.onPing);
            socket.on('http', this.onHttp);
            socket.on('start', this.onStart);
            socket.on('stop', this.onStop);
        });
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

    private onPing(): void {
        // TODO wait and send the ping
    }

    private onHttp(): void {
        // TODO vaild the request and do the request and do the response
    }

    private onStart(): void {
        // TODO start
    }

    private onStop(): void {
        // TODO stop
    }
}
