import SocketIO from 'socket.io';

class ExecutorProtocol {
    private server: SocketIO.Server;
    private port: number = 2020;

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
}
